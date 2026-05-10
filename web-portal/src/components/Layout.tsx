import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Gavel as GavelIcon,
  BarChart as BarChartIcon,
  CalendarMonth as CalendarIcon,
  Backup as BackupIcon,
  Delete as TrashIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AccountCircle as AccountCircleIcon,
  Search as SearchIcon,
  Phone as PhoneIcon,
  Folder as FolderIcon,
  Analytics as AnalyticsIcon,
  EventNote as EventNoteIcon,
  DriveEta as DriveEtaIcon,
  Inventory as InventoryIcon,
  EventAvailable as EventAvailableIcon,
  PersonAdd as PersonAddIcon,
  Description as DescriptionIcon,
  School as OnboardingIcon,
} from '@mui/icons-material';
import { authApi } from '@/services/api';
import NotificationCenter from './NotificationCenter';
import type { User } from '@/types';

const drawerWidth = 260;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  requiresRoles?: string[];
}

interface MenuSection {
  heading?: string;
  items: MenuItem[];
  requiresRoles?: string[];
}

const menuSections: MenuSection[] = [
  {
    items: [
      { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
      { text: 'Reports', icon: <BarChartIcon />, path: '/reports' },
      { text: 'Analytics', icon: <AnalyticsIcon />, path: '/analytics' },
    ],
  },
  {
    heading: 'REVENUE',
    items: [
      { text: 'Revenue', icon: <AttachMoneyIcon />, path: '/revenue' },
    ],
    requiresRoles: ['admin', 'management'],
  },
  {
    heading: 'PLANNING',
    items: [
      { text: 'Arrangements', icon: <AssignmentIcon />, path: '/arrangements' },
      { text: 'Calendar', icon: <EventNoteIcon />, path: '/calendar' },
      { text: 'Mourners', icon: <PeopleIcon />, path: '/mourners' },
    ],
  },
  {
    heading: 'OPERATIONS',
    items: [
      { text: 'Daily Run Sheet', icon: <CalendarIcon />, path: '/bookings' },
      { text: 'Staff', icon: <PeopleIcon />, path: '/staff' },
      { text: 'Vehicles', icon: <DriveEtaIcon />, path: '/vehicles' },
      { text: 'Equipment', icon: <InventoryIcon />, path: '/equipment' },
    ],
  },
  {
    heading: 'HR RESOURCES',
    items: [
      { text: 'Onboarding', icon: <OnboardingIcon />, path: '/onboarding' },
      { text: 'Policies & Procedures', icon: <DescriptionIcon />, path: '/policies' },
      { text: 'Leave Management', icon: <EventAvailableIcon />, path: '/leave-management' },
    ],
  },
  {
    heading: 'FORMS',
    items: [
      { text: 'Government Forms', icon: <GavelIcon />, path: '/government-forms' },
      { text: 'Files', icon: <FolderIcon />, path: '/files' },
    ],
  },
  {
    heading: 'FINANCES',
    items: [
      { text: 'Price Lists', icon: <ReceiptIcon />, path: '/price-lists' },
      { text: 'Invoicing', icon: <AttachMoneyIcon />, path: '/invoicing' },
    ],
  },
  {
    heading: 'ADMIN',
    items: [
      { text: 'User Registrations', icon: <PersonAddIcon />, path: '/registrations', requiresRoles: ['admin', 'management'] },
      { text: 'Call Logs', icon: <PhoneIcon />, path: '/call-logs' },
      { text: 'Export & Backup', icon: <BackupIcon />, path: '/backups' },
      { text: 'Trash', icon: <TrashIcon />, path: '/trash' },
      { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    ],
  },
];

// Flatten menu items for easy lookup
const menuItems = menuSections.flatMap(section => section.items);

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const user = await authApi.getCurrentUser();
        setCurrentUser(user);
      } catch (error) {
        console.error('Failed to load current user:', error);
      }
    };
    loadCurrentUser();
  }, []);

  const hasRole = (roles: string[]) => {
    if (!currentUser?.role) return false;
    const userRoles = Array.isArray(currentUser.role) ? currentUser.role : [currentUser.role];
    return roles.some(role => userRoles.includes(role));
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const getInitials = (name: string | undefined) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'primary.main',
      color: 'white',
    }}>
      <Toolbar sx={{
        display: 'flex',
        justifyContent: 'center',
        py: 2.5,
        px: 3,
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <img
            src="/images/careportal-logo.png"
            alt="CarePortal"
            style={{
              height: '80px',
              width: 'auto',
              maxWidth: '200px',
            }}
          />
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
      <List sx={{ py: 0.5, flex: 1, overflowY: 'auto' }}>
        {menuSections
          .filter(section => !section.requiresRoles || hasRole(section.requiresRoles))
          .map((section, sectionIndex) => (
          <Box key={sectionIndex}>
            {section.heading && (
              <ListItem sx={{ py: 0.25, px: 3, mt: sectionIndex > 0 ? 1 : 0.5 }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 800,
                    fontSize: '0.75rem',
                    color: 'rgba(255,255,255,0.9)',
                    letterSpacing: '0.12em',
                  }}
                >
                  {section.heading}
                </Typography>
              </ListItem>
            )}
            {section.items
              .filter(item => !item.requiresRoles || hasRole(item.requiresRoles))
              .map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleMenuClick(item.path)}
                  disabled={item.badge === 'Soon'}
                  sx={{
                    px: 3,
                    py: 0.5,
                    mx: 0.75,
                    borderRadius: 1,
                    color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.7)',
                    backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': {
                      backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
                      color: 'white',
                    },
                  }}
                >
                  <ListItemIcon sx={{
                    color: location.pathname === item.path ? 'white' : 'rgba(255,255,255,0.7)',
                    minWidth: 40
                  }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === item.path ? 600 : 400,
                      fontSize: '0.875rem',
                    }}
                  />
                  {item.badge && (
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {item.badge}
                    </Typography>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
          </Box>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          backgroundColor: 'white',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar sx={{ gap: 2 }}>
          <IconButton
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 1, display: { sm: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h5"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              color: 'text.primary',
              letterSpacing: '-0.01em',
            }}
          >
            {menuItems.find(item => item.path === location.pathname)?.text || 'CarePortal'}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <IconButton onClick={() => navigate('/search')} sx={{ color: 'text.secondary' }}>
            <SearchIcon />
          </IconButton>
          <NotificationCenter />
          <IconButton onClick={handleProfileMenuOpen} sx={{ color: 'text.secondary' }}>
            {currentUser?.profile_photo ? (
              <Avatar
                src={currentUser.profile_photo}
                alt={currentUser.name}
                sx={{ width: 36, height: 36 }}
              />
            ) : (
              <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontWeight: 600, fontSize: '0.9rem' }}>
                {getInitials(currentUser?.name)}
              </Avatar>
            )}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={() => { handleProfileMenuClose(); navigate('/profile'); }}>
          <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
          Profile
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}
