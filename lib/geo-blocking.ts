import MaxMind from 'maxmind';
import path from 'path';
import { securityMonitor } from './monitoring';
import { notificationService } from './notifications';

interface GeoInfo {
  country?: string;
  city?: string;
  timezone?: string;
  isProxy?: boolean;
}

class GeoBlockService {
  private static instance: GeoBlockService;
  private lookup: any;
  private asnLookup: any;
  private blockedCountries: Set<string>;
  private highRiskCountries: Set<string>;

  private constructor() {
    this.blockedCountries = new Set(process.env.BLOCKED_COUNTRIES?.split(',') || []);
    this.highRiskCountries = new Set(process.env.HIGH_RISK_COUNTRIES?.split(',') || []);
    this.initializeGeoDB();
  }

  private async initializeGeoDB() {
    try {
      // Initialize MaxMind databases
      this.lookup = await MaxMind.open(path.join(process.cwd(), 'data', 'GeoLite2-Country.mmdb'));
      this.asnLookup = await MaxMind.open(path.join(process.cwd(), 'data', 'GeoLite2-ASN.mmdb'));
      
      securityMonitor.logSecurityEvent(
        'api',
        'geodb_initialized',
        'success'
      );
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'api',
        'geodb_initialization_failed',
        'failure',
        error
      );
    }
  }

  public static getInstance(): GeoBlockService {
    if (!GeoBlockService.instance) {
      GeoBlockService.instance = new GeoBlockService();
    }
    return GeoBlockService.instance;
  }

  public async getIpInfo(ip: string): Promise<GeoInfo> {
    try {
      if (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1') {
        return { country: 'LOCAL', city: 'LOCAL', timezone: 'LOCAL' };
      }

      const geoData = await this.lookup?.get(ip);
      const asnData = await this.asnLookup?.get(ip);

      // Check if IP is likely a proxy/VPN
      const isProxy = this.isLikelyProxy(asnData);

      if (isProxy) {
        await notificationService.sendSecurityAlert(
          'Proxy Detection',
          `Suspicious IP detected: ${ip}`,
          { geoData, asnData }
        );
      }

      return {
        country: geoData?.country?.iso_code,
        city: geoData?.city?.names?.en,
        timezone: geoData?.location?.time_zone,
        isProxy,
      };
    } catch (error) {
      securityMonitor.logSecurityEvent(
        'api',
        'geo_lookup_failed',
        'failure',
        { ip, error }
      );
      return {};
    }
  }

  private isLikelyProxy(asnData: any): boolean {
    const knownProxyKeywords = [
      'vpn',
      'proxy',
      'hosting',
      'cloud',
      'datacenter',
      'anonymous',
    ];

    if (!asnData?.autonomous_system_organization) {
      return false;
    }

    const orgName = asnData.autonomous_system_organization.toLowerCase();
    return knownProxyKeywords.some(keyword => orgName.includes(keyword));
  }

  public async shouldBlockIp(ip: string): Promise<{ blocked: boolean; reason?: string }> {
    try {
      const ipInfo = await this.getIpInfo(ip);

      // Always allow localhost in development
      if (process.env.NODE_ENV === 'development' && 
          (ip === 'localhost' || ip === '127.0.0.1' || ip === '::1')) {
        return { blocked: false };
      }

      // Block if country is in blocked list
      if (ipInfo.country && this.blockedCountries.has(ipInfo.country)) {
        await this.logBlockedAccess(ip, 'Blocked country', ipInfo);
        return { blocked: true, reason: 'Country not allowed' };
      }

      // Block if detected as proxy/VPN (configurable)
      if (ipInfo.isProxy && process.env.BLOCK_PROXIES === 'true') {
        await this.logBlockedAccess(ip, 'Proxy detected', ipInfo);
        return { blocked: true, reason: 'Proxy/VPN not allowed' };
      }

      // Enhanced monitoring for high-risk countries
      if (ipInfo.country && this.highRiskCountries.has(ipInfo.country)) {
        securityMonitor.logSecurityEvent(
          'api',
          'high_risk_country_access',
          'success',
          { ip, ...ipInfo }
        );
      }

      return { blocked: false };
    } catch (error) {
      // Log error but allow access if geolocation fails
      securityMonitor.logSecurityEvent(
        'api',
        'geo_block_check_failed',
        'failure',
        { ip, error }
      );
      return { blocked: false };
    }
  }

  private async logBlockedAccess(ip: string, reason: string, ipInfo: GeoInfo): Promise<void> {
    securityMonitor.logSecurityEvent(
      'api',
      'access_blocked',
      'failure',
      { ip, reason, ipInfo }
    );

    await notificationService.sendSecurityAlert(
      'Access Blocked',
      `Access blocked from IP: ${ip}`,
      { reason, ipInfo }
    );
  }
}

export const geoBlockService = GeoBlockService.getInstance();
