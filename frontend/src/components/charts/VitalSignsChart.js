import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import { format } from 'date-fns';

const VitalSignsChart = ({ data = [], height = 300 }) => {
  // Group vital signs by parameter type
  const groupedData = useMemo(() => {
    const grouped = {};
    data.forEach((vital) => {
      const param = vital.parameter;
      if (!grouped[param]) {
        grouped[param] = [];
      }
      grouped[param].push({
        ...vital,
        timestamp: new Date(vital.recordedAt),
      });
    });

    // Sort by timestamp
    Object.keys(grouped).forEach(param => {
      grouped[param].sort((a, b) => a.timestamp - b.timestamp);
    });

    return grouped;
  }, [data]);

  const parameterConfig = {
    pulse: {
      label: 'Pulse Rate',
      unit: 'bpm',
      color: '#FF6384',
      normalRange: [60, 100],
    },
    blood_pressure_systolic: {
      label: 'BP Systolic',
      unit: 'mmHg',
      color: '#36A2EB',
      normalRange: [90, 140],
    },
    blood_pressure_diastolic: {
      label: 'BP Diastolic',
      unit: 'mmHg',
      color: '#4BC0C0',
      normalRange: [60, 90],
    },
    temperature: {
      label: 'Body Temperature',
      unit: '°F',
      color: '#FF9F40',
      normalRange: [97, 99],
    },
    respiratory_rate: {
      label: 'Respiratory Rate',
      unit: '/min',
      color: '#9966FF',
      normalRange: [12, 20],
    },
    oxygen_saturation: {
      label: 'Oxygen Saturation',
      unit: '%',
      color: '#FF6384',
      normalRange: [95, 100],
    },
  };

  const createChartData = (parameter, readings) => {
    const config = parameterConfig[parameter];
    if (!config) return null;

    return {
      labels: readings.map(reading => 
        format(reading.timestamp, 'HH:mm')
      ),
      datasets: [
        {
          label: `${config.label} (${config.unit})`,
          data: readings.map(reading => reading.value),
          borderColor: config.color,
          backgroundColor: config.color + '20',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: config.color,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          afterLabel: (context) => {
            const dataPoint = context.raw;
            const parameter = Object.keys(groupedData)[context.datasetIndex];
            const config = parameterConfig[parameter];
            const isNormal = dataPoint >= config.normalRange[0] && dataPoint <= config.normalRange[1];
            return isNormal ? '✓ Normal' : '⚠ Outside normal range';
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value) {
            return value;
          },
        },
      },
      x: {
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
    elements: {
      point: {
        hoverRadius: 8,
      },
    },
  };

  const getLatestReading = (readings) => {
    if (!readings || readings.length === 0) return null;
    return readings[readings.length - 1];
  };

  const isNormalValue = (value, parameter) => {
    const config = parameterConfig[parameter];
    if (!config) return true;
    return value >= config.normalRange[0] && value <= config.normalRange[1];
  };

  if (Object.keys(groupedData).length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          No vital signs data available
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Current Values Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {Object.entries(groupedData).map(([parameter, readings]) => {
          const latest = getLatestReading(readings);
          const config = parameterConfig[parameter];
          if (!latest || !config) return null;

          return (
            <Grid item xs={6} sm={4} md={3} key={parameter}>
              <Card 
                variant="outlined" 
                sx={{ 
                  height: '100%',
                  backgroundColor: isNormalValue(latest.value, parameter) 
                    ? 'success.light' 
                    : 'warning.light',
                  opacity: 0.9
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {config.label}
                  </Typography>
                  <Typography variant="h6" component="div">
                    {latest.value} <span style={{ fontSize: '0.8rem' }}>{config.unit}</span>
                  </Typography>
                  <Chip
                    label={isNormalValue(latest.value, parameter) ? 'Normal' : 'Abnormal'}
                    size="small"
                    color={isNormalValue(latest.value, parameter) ? 'success' : 'warning'}
                    sx={{ mt: 1 }}
                  />
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Charts */}
      <Grid container spacing={3}>
        {Object.entries(groupedData).map(([parameter, readings]) => {
          const chartData = createChartData(parameter, readings);
          const config = parameterConfig[parameter];
          
          if (!chartData || !config) return null;

          return (
            <Grid item xs={12} md={6} key={parameter}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {config.label} Trend
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Normal Range: {config.normalRange[0]} - {config.normalRange[1]} {config.unit}
                  </Typography>
                  <Box height={height}>
                    <Line 
                      data={chartData} 
                      options={{
                        ...chartOptions,
                        scales: {
                          ...chartOptions.scales,
                          y: {
                            ...chartOptions.scales.y,
                            min: Math.max(0, config.normalRange[0] - 10),
                            max: config.normalRange[1] + 10,
                          }
                        }
                      }} 
                    />
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Latest: {getLatestReading(readings)?.value} {config.unit} at{' '}
                      {format(getLatestReading(readings)?.timestamp, 'HH:mm:ss')}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Trend Analysis */}
      <Box sx={{ mt: 3, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="h6" gutterBottom>
          Vital Signs Analysis
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(groupedData).map(([parameter, readings]) => {
            const config = parameterConfig[parameter];
            const latest = getLatestReading(readings);
            const previous = readings.length > 1 ? readings[readings.length - 2] : null;
            
            if (!config || !latest) return null;

            let trend = 'stable';
            let trendColor = 'text.secondary';
            
            if (previous) {
              const change = latest.value - previous.value;
              const percentChange = Math.abs(change / previous.value) * 100;
              
              if (percentChange > 5) {
                if (change > 0) {
                  trend = 'increasing';
                  trendColor = 'warning.main';
                } else {
                  trend = 'decreasing';
                  trendColor = 'info.main';
                }
              }
            }

            return (
              <Grid item xs={12} sm={6} md={4} key={parameter}>
                <Box>
                  <Typography variant="body2" color="text.primary">
                    {config.label}
                  </Typography>
                  <Typography variant="body2" color={trendColor}>
                    Status: {isNormalValue(latest.value, parameter) ? 'Normal' : 'Attention needed'}
                  </Typography>
                  <Typography variant="body2" color={trendColor}>
                    Trend: {trend}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Box>
    </Box>
  );
};

export default VitalSignsChart;