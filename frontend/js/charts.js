/**
 * Chart.js Analytics & Visualizations for ReCity Impact Dashboard
 */

let wardChartInstance = null;
let votingChartInstance = null;
let radarChartInstance = null;

const ChartsModule = {
  renderWardChart(wardsData) {
    const ctx = document.getElementById("wardChartCanvas");
    if (!ctx) return;

    if (wardChartInstance) wardChartInstance.destroy();

    const labels = wardsData.map(w => w.ward);
    const areas = wardsData.map(w => w.area_sqm);
    const votes = wardsData.map(w => w.votes);

    wardChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Identified Area (m²)',
            data: areas,
            backgroundColor: 'rgba(16, 185, 129, 0.75)',
            borderColor: '#10b981',
            borderWidth: 1.5,
            borderRadius: 6
          },
          {
            label: 'Community Votes',
            data: votes,
            backgroundColor: 'rgba(15, 68, 53, 0.85)',
            borderColor: '#0f4435',
            borderWidth: 1.5,
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { font: { family: 'Inter', size: 12 } } },
          tooltip: {
            backgroundColor: '#0f4435',
            titleFont: { family: 'Plus Jakarta Sans', weight: 'bold' }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f1f5f2' } }
        }
      }
    });
  },

  renderVotingChart(proposalsData) {
    const ctx = document.getElementById("votingChartCanvas");
    if (!ctx) return;

    if (votingChartInstance) votingChartInstance.destroy();

    votingChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pocket Gardens & Ecology', 'Children Play & Recreation', 'Community Learning Pavilions'],
        datasets: [{
          data: [42, 38, 20],
          backgroundColor: [
            '#10b981', // Green
            '#f43f5e', // Coral
            '#8b5cf6'  // Purple
          ],
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } } }
        }
      }
    });
  },

  renderRadarImpact() {
    const ctx = document.getElementById("impactRadarCanvas");
    if (!ctx) return;

    if (radarChartInstance) radarChartInstance.destroy();

    radarChartInstance = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Urban Heat Relief', 'Carbon Offset', 'Social Cohesion', 'Safe Child Access', 'Cost Feasibility', 'Drainage Permeability'],
        datasets: [
          {
            label: 'Concept A (Garden)',
            data: [92, 95, 80, 65, 85, 90],
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: '#10b981',
            pointBackgroundColor: '#10b981'
          },
          {
            label: 'Concept B (Playground)',
            data: [60, 45, 95, 98, 75, 70],
            backgroundColor: 'rgba(244, 63, 94, 0.2)',
            borderColor: '#f43f5e',
            pointBackgroundColor: '#f43f5e'
          },
          {
            label: 'Concept C (Learning Hub)',
            data: [75, 80, 90, 75, 78, 65],
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            borderColor: '#8b5cf6',
            pointBackgroundColor: '#8b5cf6'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: '#e2ebe4' },
            grid: { color: '#e2ebe4' },
            pointLabels: { font: { size: 10.5, family: 'Inter' } },
            suggestedMin: 30,
            suggestedMax: 100
          }
        },
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } } }
        }
      }
    });
  }
};
