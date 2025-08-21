import { FamilyInsights, PopularRestaurant, CuisinePreference, MemberActivity, TimeRange } from '@/types/analytics';

export interface AnalyticsExportData {
  familyInsights: FamilyInsights | null;
  popularRestaurants: PopularRestaurant[];
  cuisinePreferences: CuisinePreference[];
  memberActivity: MemberActivity[];
  timeRange: TimeRange;
  exportDate: string;
}

export function exportToCSV(data: AnalyticsExportData): void {
  const { familyInsights, popularRestaurants, cuisinePreferences, memberActivity, timeRange } = data;
  
  // Create CSV content
  let csvContent = "data:text/csv;charset=utf-8,";
  
  // Add header
  csvContent += "YumZoom Family Analytics Export\n";
  csvContent += `Export Date:,${new Date().toLocaleDateString()}\n`;
  csvContent += `Time Range:,${getTimeRangeLabel(timeRange)}\n\n`;
  
  // Family Insights Section
  if (familyInsights) {
    csvContent += "FAMILY INSIGHTS\n";
    csvContent += "Metric,Value\n";
    csvContent += `Total Restaurants,${familyInsights.total_restaurants}\n`;
    csvContent += `Total Ratings,${familyInsights.total_ratings}\n`;
    csvContent += `Average Rating,${familyInsights.average_family_rating}/10\n`;
    csvContent += `Estimated Spending,$${familyInsights.estimated_spending}\n`;
    csvContent += `Total Family Members,${familyInsights.total_family_members}\n`;
    csvContent += `Active Members,${familyInsights.active_members}\n\n`;
  }
  
  // Popular Restaurants Section
  if (popularRestaurants.length > 0) {
    csvContent += "POPULAR RESTAURANTS\n";
    csvContent += "Restaurant Name,Cuisine Type,Visit Frequency,Average Rating,Last Visit\n";
    popularRestaurants.forEach(restaurant => {
      csvContent += `"${restaurant.restaurant_name}",${restaurant.cuisine_type || 'N/A'},${restaurant.visit_frequency},${restaurant.average_rating.toFixed(1)},${new Date(restaurant.last_visit).toLocaleDateString()}\n`;
    });
    csvContent += "\n";
  }
  
  // Cuisine Preferences Section
  if (cuisinePreferences.length > 0) {
    csvContent += "CUISINE PREFERENCES\n";
    csvContent += "Cuisine Type,Rating Count,Average Rating,Percentage\n";
    cuisinePreferences.forEach(cuisine => {
      csvContent += `${cuisine.cuisine_type},${cuisine.rating_count},${cuisine.average_rating.toFixed(1)},${cuisine.percentage.toFixed(1)}%\n`;
    });
    csvContent += "\n";
  }
  
  // Member Activity Section
  if (memberActivity.length > 0) {
    csvContent += "FAMILY MEMBER ACTIVITY\n";
    csvContent += "Member Name,Relationship,Rating Count,Average Rating,Favorite Restaurant,Favorite Cuisine\n";
    memberActivity.forEach(member => {
      csvContent += `"${member.member_name}",${member.relationship || 'N/A'},${member.rating_count},${member.average_rating.toFixed(1)},"${member.favorite_restaurant || 'N/A'}",${member.favorite_cuisine || 'N/A'}\n`;
    });
  }
  
  // Create and download file
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `yumzoom-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToPDF(data: AnalyticsExportData): void {
  // For now, we'll create a printable HTML version that can be saved as PDF
  const { familyInsights, popularRestaurants, cuisinePreferences, memberActivity, timeRange } = data;
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export as PDF');
    return;
  }
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>YumZoom Analytics Report</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #f59e0b;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .section {
          margin-bottom: 30px;
        }
        .section h2 {
          color: #f59e0b;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          border: 1px solid #e5e7eb;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f9fafb;
          font-weight: bold;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 15px;
          margin-top: 15px;
        }
        .metric-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 15px;
          background-color: #f9fafb;
        }
        .metric-value {
          font-size: 24px;
          font-weight: bold;
          color: #f59e0b;
        }
        .metric-label {
          font-size: 14px;
          color: #6b7280;
          margin-top: 5px;
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>YumZoom Family Analytics Report</h1>
        <p>Time Period: ${getTimeRangeLabel(timeRange)}</p>
        <p>Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
      
      ${familyInsights ? `
      <div class="section">
        <h2>Family Dining Insights</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-value">${familyInsights.total_restaurants}</div>
            <div class="metric-label">Restaurants Visited</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${familyInsights.total_ratings}</div>
            <div class="metric-label">Total Ratings</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${familyInsights.average_family_rating}/10</div>
            <div class="metric-label">Average Rating</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">$${familyInsights.estimated_spending}</div>
            <div class="metric-label">Estimated Spending</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${familyInsights.active_members}/${familyInsights.total_family_members}</div>
            <div class="metric-label">Active Members</div>
          </div>
        </div>
      </div>
      ` : ''}
      
      ${popularRestaurants.length > 0 ? `
      <div class="section">
        <h2>Popular Restaurants</h2>
        <table>
          <thead>
            <tr>
              <th>Restaurant</th>
              <th>Cuisine</th>
              <th>Visits</th>
              <th>Avg Rating</th>
              <th>Last Visit</th>
            </tr>
          </thead>
          <tbody>
            ${popularRestaurants.map(restaurant => `
              <tr>
                <td>${restaurant.restaurant_name}</td>
                <td>${restaurant.cuisine_type || 'N/A'}</td>
                <td>${restaurant.visit_frequency}</td>
                <td>${restaurant.average_rating.toFixed(1)}/10</td>
                <td>${new Date(restaurant.last_visit).toLocaleDateString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${cuisinePreferences.length > 0 ? `
      <div class="section">
        <h2>Cuisine Preferences</h2>
        <table>
          <thead>
            <tr>
              <th>Cuisine Type</th>
              <th>Rating Count</th>
              <th>Average Rating</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${cuisinePreferences.map(cuisine => `
              <tr>
                <td>${cuisine.cuisine_type}</td>
                <td>${cuisine.rating_count}</td>
                <td>${cuisine.average_rating.toFixed(1)}/10</td>
                <td>${cuisine.percentage.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      ${memberActivity.length > 0 ? `
      <div class="section">
        <h2>Family Member Activity</h2>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Relationship</th>
              <th>Ratings</th>
              <th>Avg Rating</th>
              <th>Favorite Restaurant</th>
              <th>Favorite Cuisine</th>
            </tr>
          </thead>
          <tbody>
            ${memberActivity.map(member => `
              <tr>
                <td>${member.member_name}</td>
                <td>${member.relationship || 'N/A'}</td>
                <td>${member.rating_count}</td>
                <td>${member.average_rating.toFixed(1)}/10</td>
                <td>${member.favorite_restaurant || 'N/A'}</td>
                <td>${member.favorite_cuisine || 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      ` : ''}
      
      <div class="no-print" style="margin-top: 40px; text-align: center;">
        <button onclick="window.print()" style="background: #f59e0b; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
          Print / Save as PDF
        </button>
        <button onclick="window.close()" style="background: #6b7280; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; margin-left: 10px;">
          Close
        </button>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

export function exportToJSON(data: AnalyticsExportData): void {
  const jsonData = {
    ...data,
    exportMetadata: {
      exportDate: new Date().toISOString(),
      appVersion: "1.0.0",
      dataFormat: "YumZoom Analytics Export v1"
    }
  };
  
  const dataStr = JSON.stringify(jsonData, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const link = document.createElement("a");
  link.setAttribute("href", dataUri);
  link.setAttribute("download", `yumzoom-analytics-${data.timeRange}-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function getTimeRangeLabel(range: TimeRange): string {
  switch (range) {
    case 'week': return 'Last Week';
    case 'month': return 'Last Month';
    case 'quarter': return 'Last Quarter';
    case 'year': return 'Last Year';
    default: return 'Last Month';
  }
}
