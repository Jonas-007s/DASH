import React from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Box,
  Divider,
  Tooltip
} from '@mui/material';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import WarningIcon from '@mui/icons-material/Warning';

/**
 * Componente de tarjeta de estadísticas por área
 * @param {Object} area - Datos del área (nombre, contador, color)
 * @param {Array} trendData - Datos de tendencia para el gráfico
 * @param {Function} onClick - Función para manejar el clic en la tarjeta
 * @param {String} trendDirection - Dirección de la tendencia ('up', 'down', 'neutral')
 * @param {Number} lowActivityThreshold - Umbral para considerar baja actividad
 */
const AreaStatCard = ({ 
  area, 
  trendData, 
  onClick, 
  trendDirection = 'neutral',
  lowActivityThreshold = 3
}) => {
  if (!area) return null;

  const hasLowActivity = area.count < lowActivityThreshold;

  return (
    <Card 
      sx={{ 
        cursor: 'pointer',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 3
        }
      }} 
      onClick={onClick}
    >
      <CardHeader 
        title={area.name} 
        action={
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {trendDirection === 'up' && (
              <Tooltip title="Tendencia al alza">
                <TrendingUpIcon sx={{ color: 'success.main' }} />
              </Tooltip>
            )}
            {trendDirection === 'down' && (
              <Tooltip title="Tendencia a la baja">
                <TrendingDownIcon sx={{ color: 'error.main' }} />
              </Tooltip>
            )}
            {hasLowActivity && (
              <Tooltip title="Baja actividad">
                <WarningIcon sx={{ color: 'warning.main', ml: 1 }} />
              </Tooltip>
            )}
          </Box>
        }
      />
      <Divider />
      <CardContent>
        <Typography variant="h3" align="center" style={{ color: area.color }}>
          {area.count}
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary">
          Productos registrados en esta área
        </Typography>
        {trendData && trendData.length > 0 && (
          <Box sx={{ height: 60, mt: 2 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={area.color} 
                  strokeWidth={2} 
                  dot={false} 
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AreaStatCard;