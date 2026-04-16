import { useEffect, useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  ListItemIcon,
  ListItemText,
  Button,
  Chip,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  Message as MessageIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import api from '@/services/api';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  createdAt: string;
}

interface SystemAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  startsAt: string;
  expiresAt: string | null;
  createdAt: string;
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    loadSystemAlerts();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      loadUnreadCount();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications', {
        params: { limit: 10 }
      });
      setNotifications(response.data.notifications);
      await loadUnreadCount();
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const loadSystemAlerts = async () => {
    try {
      const response = await api.get('/notifications/alerts');
      setSystemAlerts(response.data.alerts);
    } catch (error) {
      console.error('Failed to load system alerts:', error);
    }
  };

  const handleOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (notifications.length === 0) {
      loadNotifications();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      try {
        await api.put(`/notifications/${notification.id}/read`);
        await loadNotifications();
      } catch (error) {
        console.error('Failed to mark notification as read:', error);
      }
    }

    // Navigate if action URL exists
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }

    handleClose();
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      await loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleClearRead = async () => {
    try {
      await api.delete('/notifications/clear-read');
      await loadNotifications();
    } catch (error) {
      console.error('Failed to clear read notifications:', error);
    }
  };

  const handleDismissAlert = async (alertId: string) => {
    try {
      await api.post(`/notifications/alerts/${alertId}/dismiss`);
      setSystemAlerts(systemAlerts.filter(alert => alert.id !== alertId));
    } catch (error) {
      console.error('Failed to dismiss alert:', error);
    }
  };

  const getNotificationIcon = (category: string) => {
    switch (category) {
      case 'arrangement':
        return <AssignmentIcon fontSize="small" />;
      case 'invoice':
        return <MoneyIcon fontSize="small" />;
      case 'message':
        return <MessageIcon fontSize="small" />;
      default:
        return <InfoIcon fontSize="small" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'warning':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'error':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'info';
    }
  };

  return (
    <>
      {/* System Alerts */}
      {systemAlerts.map(alert => (
        <Alert
          key={alert.id}
          severity={getTypeColor(alert.type) as any}
          onClose={() => handleDismissAlert(alert.id)}
          sx={{
            position: 'fixed',
            top: 70,
            right: 16,
            zIndex: 9999,
            maxWidth: 400,
            mb: 1,
          }}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {alert.title}
          </Typography>
          <Typography variant="body2">{alert.message}</Typography>
        </Alert>
      ))}

      {/* Notification Bell */}
      <IconButton color="inherit" onClick={handleOpen}>
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
          },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight="bold">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Chip label={`${unreadCount} unread`} size="small" color="primary" />
          )}
        </Box>

        <Divider />

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              {notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    borderLeft: notification.isRead ? 'none' : '4px solid',
                    borderColor: 'primary.main',
                    whiteSpace: 'normal',
                    py: 1.5,
                  }}
                >
                  <ListItemIcon>{getNotificationIcon(notification.category)}</ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {notification.title}
                        </Typography>
                        {getTypeIcon(notification.type)}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="caption" component="div">
                          {notification.message}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </Typography>
                      </>
                    }
                  />
                </MenuItem>
              ))}
            </Box>

            <Divider />

            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Button size="small" onClick={handleMarkAllRead} disabled={unreadCount === 0}>
                Mark all read
              </Button>
              <Button size="small" onClick={handleClearRead}>
                Clear read
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}
