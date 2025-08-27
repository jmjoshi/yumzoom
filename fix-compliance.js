// Fix remaining compliance logging errors by replacing 'legal' with 'compliance'
import { promises as fs } from 'fs';

async function fixComplianceLogging() {
  const filePath = 'C:\\Users\\Jayant\\Documents\\projects\\yumzoom\\lib\\restaurant-compliance.ts';
  
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Replace all instances of 'legal', with 'compliance', in logSecurityEvent calls
    content = content.replace(
      /securityMonitor\.logSecurityEvent\(\s*'legal',/g,
      "securityMonitor.logSecurityEvent(\n        'compliance',"
    );
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log('Fixed all compliance logging calls');
  } catch (error) {
    console.error('Error fixing file:', error);
  }
}

fixComplianceLogging();
