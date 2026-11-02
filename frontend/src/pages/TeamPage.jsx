import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Alert,
  Avatar,
  Tab,
  Tabs,
  Tooltip,
  InputAdornment,
} from '@mui/material';
import {
  Groups,
  PersonAddAlt1,
  Delete,
  ContentCopy,
  History,
  CheckCircle,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { teamAPI, auditAPI } from '../services/api';
import { handleApiError, handleSuccess, handleInfo } from '../utils/errorHandler';
import { formatDate, getInitials } from '../utils/formatters';
import { PageHeader, EmptyState, LoadingState, ConfirmDialog, SectionCard } from '../components/common';

// Roles that can be assigned to a team member via the dropdown. OWNER is the
// account owner and cannot be assigned; it is shown as a non-editable chip.
const SELECTABLE_ROLES = [
  { value: 'ACCOUNTANT', label: 'Accountant', color: 'info' },
  { value: 'VIEWER', label: 'Viewer', color: 'default' },
];

// Full label/colour map, including roles that are display-only (e.g. OWNER).
const ROLE_META = {
  OWNER: { label: 'Owner', color: 'warning' },
  ADMIN: { label: 'Admin', color: 'primary' },
  MANAGER: { label: 'Manager', color: 'secondary' },
  ACCOUNTANT: { label: 'Accountant', color: 'info' },
  VIEWER: { label: 'Viewer', color: 'default' },
};

const roleMeta = (role) =>
  ROLE_META[(role || '').toUpperCase()] || { label: role || 'Member', color: 'default' };

const isOwnerMember = (member) =>
  Boolean(member?.isOwner) || (member?.role || '').toUpperCase() === 'OWNER';

const inviteSchema = Yup.object({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  role: Yup.string().required('Role is required'),
});

export default function TeamPage() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <PageHeader
        title="Team"
        subtitle="Invite teammates, manage their roles and review account activity"
        icon={<Groups />}
      />

      <Card sx={{ mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(e, v) => setTab(v)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<Groups />} label="Team Members" iconPosition="start" />
          <Tab icon={<History />} label="Activity Log" iconPosition="start" />
        </Tabs>
      </Card>

      {tab === 0 ? <TeamMembersTab /> : <ActivityLogTab />}
    </Box>
  );
}

function TeamMembersTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openInvite, setOpenInvite] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [removingBusy, setRemovingBusy] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [updatingRoleId, setUpdatingRoleId] = useState(null);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await teamAPI.getAll();
      setMembers(response.data.members || response.data.team || response.data.users || []);
    } catch (err) {
      setError(handleApiError(err, 'Failed to load team members'));
    } finally {
      setLoading(false);
    }
  };

  const inviteFormik = useFormik({
    initialValues: { name: '', email: '', role: 'ACCOUNTANT' },
    validationSchema: inviteSchema,
    onSubmit: async (values, { setSubmitting, resetForm }) => {
      try {
        const response = await teamAPI.invite(values);
        const pwd =
          response.data?.tempPassword ||
          response.data?.temporaryPassword ||
          response.data?.password ||
          response.data?.member?.tempPassword;
        handleSuccess('Invitation sent successfully');
        setOpenInvite(false);
        resetForm();
        if (pwd) {
          setTempPassword(pwd);
        }
        fetchMembers();
      } catch (err) {
        handleApiError(err);
      } finally {
        setSubmitting(false);
      }
    },
  });

  const handleRoleChange = async (member, role) => {
    try {
      setUpdatingRoleId(member.id);
      await teamAPI.updateRole(member.id, { role });
      handleSuccess(`Role updated to ${roleMeta(role).label}`);
      setMembers((prev) => prev.map((m) => (m.id === member.id ? { ...m, role } : m)));
    } catch (err) {
      handleApiError(err, 'Failed to update role');
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRemove = async () => {
    if (!removing) return;
    try {
      setRemovingBusy(true);
      await teamAPI.remove(removing.id);
      handleSuccess('Team member removed');
      setRemoving(null);
      fetchMembers();
    } catch (err) {
      handleApiError(err);
    } finally {
      setRemovingBusy(false);
    }
  };

  const copyPassword = () => {
    if (tempPassword && navigator.clipboard) {
      navigator.clipboard.writeText(tempPassword);
      handleInfo('Temporary password copied to clipboard');
    }
  };

  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<PersonAddAlt1 />}
          onClick={() => setOpenInvite(true)}
          className="gradient-button-primary"
        >
          Invite Member
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <SectionCard noPadding>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <LoadingState variant="table" rows={5} columns={4} />
          </Box>
        ) : members.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Member</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {members.map((member) => {
                  const meta = roleMeta(member.role);
                  return (
                    <TableRow key={member.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.85rem' }}>
                            {getInitials(member.name || member.email)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>
                            {member.name || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {member.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {isOwnerMember(member) ? (
                          <Chip label="Owner" size="small" color="warning" />
                        ) : (
                          (() => {
                            const currentRole = (member.role || 'VIEWER').toUpperCase();
                            const isKnown = SELECTABLE_ROLES.some((r) => r.value === currentRole);
                            return (
                              <FormControl size="small" sx={{ minWidth: 140 }}>
                                <Select
                                  value={isKnown ? currentRole : 'VIEWER'}
                                  disabled={updatingRoleId === member.id}
                                  onChange={(e) => handleRoleChange(member, e.target.value)}
                                >
                                  {!isKnown && (
                                    <MenuItem value="VIEWER" disabled>
                                      {roleMeta(currentRole).label}
                                    </MenuItem>
                                  )}
                                  {SELECTABLE_ROLES.map((r) => (
                                    <MenuItem key={r.value} value={r.value}>
                                      {r.label}
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            );
                          })()
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.status || (member.active === false ? 'Invited' : 'Active')}
                          size="small"
                          color={member.status === 'Active' || member.active !== false ? 'success' : 'default'}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell align="right">
                        {!isOwnerMember(member) && (
                          <Tooltip title="Remove member">
                            <IconButton size="small" color="error" onClick={() => setRemoving(member)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <EmptyState
            icon={<Groups />}
            title="No team members yet"
            message="Invite colleagues to collaborate on invoicing, purchases and GST filing."
            action={
              <Button
                variant="contained"
                startIcon={<PersonAddAlt1 />}
                onClick={() => setOpenInvite(true)}
                className="gradient-button-primary"
              >
                Invite Member
              </Button>
            }
          />
        )}
      </SectionCard>

      {/* Invite dialog */}
      <Dialog open={openInvite} onClose={() => setOpenInvite(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite Team Member</DialogTitle>
        <form onSubmit={inviteFormik.handleSubmit}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label="Full Name *"
                  value={inviteFormik.values.name}
                  onChange={inviteFormik.handleChange}
                  onBlur={inviteFormik.handleBlur}
                  error={inviteFormik.touched.name && Boolean(inviteFormik.errors.name)}
                  helperText={inviteFormik.touched.name && inviteFormik.errors.name}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label="Email Address *"
                  type="email"
                  value={inviteFormik.values.email}
                  onChange={inviteFormik.handleChange}
                  onBlur={inviteFormik.handleBlur}
                  error={inviteFormik.touched.email && Boolean(inviteFormik.errors.email)}
                  helperText={inviteFormik.touched.email && inviteFormik.errors.email}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  id="role"
                  name="role"
                  label="Role *"
                  value={inviteFormik.values.role}
                  onChange={inviteFormik.handleChange}
                >
                  {SELECTABLE_ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      {r.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInvite(false)}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={inviteFormik.isSubmitting}
              className="gradient-button-primary"
            >
              {inviteFormik.isSubmitting ? 'Inviting...' : 'Send Invite'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Temp password dialog */}
      <Dialog open={Boolean(tempPassword)} onClose={() => setTempPassword(null)} maxWidth="xs" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircle color="success" />
            Member Invited
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Share this temporary password with the new member. They will be asked to change it on first login.
          </Typography>
          <TextField
            fullWidth
            value={tempPassword || ''}
            InputProps={{
              readOnly: true,
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title="Copy">
                    <IconButton onClick={copyPassword} edge="end">
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
            sx={{ '& input': { fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.05em' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setTempPassword(null)} className="gradient-button-primary">
            Done
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(removing)}
        title="Remove Team Member"
        message={
          <>
            Remove <strong>{removing?.name || removing?.email}</strong> from your team? They will lose access
            immediately.
          </>
        }
        confirmLabel="Remove"
        loading={removingBusy}
        onConfirm={handleRemove}
        onClose={() => setRemoving(null)}
      />
    </>
  );
}

function ActivityLogTab() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditAPI.getAll({ page: page + 1, limit: rowsPerPage });
      const data = response.data || {};
      setLogs(data.logs || data.auditLogs || data.data || []);
      setTotalCount(data.pagination?.total ?? data.total ?? 0);
    } catch (err) {
      setError(handleApiError(err, 'Failed to load activity log'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <SectionCard noPadding>
        {loading ? (
          <Box sx={{ p: 2 }}>
            <LoadingState variant="table" rows={6} columns={4} />
          </Box>
        ) : logs.length > 0 ? (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date &amp; Time</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Action</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {logs.map((log, i) => (
                    <TableRow key={log.id || i} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(log.createdAt || log.timestamp || log.date, 'dd MMM yyyy, HH:mm')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {log.userName || log.user?.name || log.user?.email || log.userEmail || 'System'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={log.action || log.event || 'Activity'} size="small" variant="outlined" color="primary" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="text.secondary">
                          {log.details ||
                            log.description ||
                            log.message ||
                            [log.entity || log.entityType, log.entityId].filter(Boolean).join(' #') ||
                            '-'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={totalCount}
              page={page}
              onPageChange={(e, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50]}
            />
          </>
        ) : (
          <EmptyState
            icon={<History />}
            title="No activity yet"
            message="User actions such as logins, invoice edits and GST filings will appear here."
          />
        )}
      </SectionCard>
    </>
  );
}
