import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Alert,
  AlertTitle,
  Chip,
  Card,
  CardContent,
  Typography,
} from '@mui/material';
import { Lightbulb } from '@mui/icons-material';
import { insightsAPI } from '../services/api';
import { handleApiError } from '../utils/errorHandler';
import { PageHeader, EmptyState, LoadingState } from '../components/common';

// Map an insight severity to an MUI Alert severity.
export const severityToAlert = (severity) => {
  const s = (severity || '').toLowerCase();
  if (s === 'critical' || s === 'high' || s === 'error') return 'error';
  if (s === 'warning' || s === 'medium') return 'warning';
  if (s === 'success' || s === 'positive') return 'success';
  return 'info';
};

export default function InsightsPage() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await insightsAPI.getAll();
      const data = response.data || {};
      setInsights(Array.isArray(data.insights) ? data.insights : Array.isArray(data) ? data : []);
    } catch (err) {
      setInsights([]);
      setError(handleApiError(err, 'Failed to load insights'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Insights"
        subtitle="Smart suggestions and alerts to keep your business compliant and healthy"
        icon={<Lightbulb />}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {loading ? (
        <LoadingState variant="cards" rows={4} />
      ) : insights.length > 0 ? (
        <Grid container spacing={2}>
          {insights.map((insight, i) => (
            <Grid item xs={12} key={insight.id || i}>
              <Alert
                severity={severityToAlert(insight.severity)}
                icon={<Lightbulb />}
                sx={{ alignItems: 'flex-start' }}
              >
                <AlertTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {insight.title || 'Insight'}
                  {insight.category && (
                    <Chip label={insight.category} size="small" variant="outlined" />
                  )}
                </AlertTitle>
                {insight.message}
              </Alert>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Card>
          <CardContent>
            <EmptyState
              icon={<Lightbulb />}
              title="No insights right now"
              message="As you record invoices, purchases and returns, we'll surface useful suggestions and alerts here."
            />
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
