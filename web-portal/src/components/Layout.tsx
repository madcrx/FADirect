import { useState } from 'react';
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
} from '@mui/icons-material';
import { authApi } from '@/services/api';
import NotificationCenter from './NotificationCenter';

const drawerWidth = 260;

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
}

interface MenuSection {
  heading?: string;
  items: MenuItem[];
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
    heading: 'OPERATIONS',
    items: [
      { text: 'Arrangements', icon: <AssignmentIcon />, path: '/arrangements' },
      { text: 'Schedule', icon: <CalendarIcon />, path: '/bookings' },
      { text: 'Mourners', icon: <PeopleIcon />, path: '/mourners' },
      { text: 'Staff', icon: <PeopleIcon />, path: '/staff' },
      { text: 'Vehicles', icon: <DriveEtaIcon />, path: '/vehicles' },
      { text: 'Equipment', icon: <InventoryIcon />, path: '/equipment' },
    ],
  },
  {
    heading: 'PLANNING',
    items: [
      { text: 'Government Forms', icon: <GavelIcon />, path: '/government-forms' },
      { text: 'Forms', icon: <FolderIcon />, path: '/files' },
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

  const drawer = (
    <Box>
      <Toolbar sx={{ backgroundColor: 'primary.main', color: 'white' }}>
        <Typography variant="h6" noWrap component="div" fontWeight="bold">
          FA Direct Portal
        </Typography>
      </Toolbar>
      <Divider />
      <List sx={{ py: 0 }}>
        {menuSections.map((section, sectionIndex) => (
          <Box key={sectionIndex}>
            {section.heading && (
              <ListItem sx={{ py: 1.5, px: 2 }}>
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    color: 'warning.main',
                    letterSpacing: 1,
                  }}
                >
                  {section.heading}
                </Typography>
              </ListItem>
            )}
            {section.items.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => handleMenuClick(item.path)}
                  disabled={item.badge === 'Soon'}
                  sx={{ pl: section.heading ? 3 : 2 }}
                >
                  <ListItemIcon sx={{ color: location.pathname === item.path ? 'primary.main' : 'inherit', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: location.pathname === item.path ? 600 : 400,
                      fontSize: '0.9rem',
                    }}
                  />
                  {item.badge && (
                    <Typography variant="caption" color="text.secondary">
                      {item.badge}
                    </Typography>
                  )}
                </ListItemButton>
              </ListItem>
            ))}
            {sectionIndex < menuSections.length - 1 && <Divider sx={{ my: 0.5 }} />}
          </Box>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'FA Direct'}
          </Typography>
          <IconButton color="inherit" onClick={() => navigate('/search')}>
            <SearchIcon />
          </IconButton>
          <NotificationCenter />
          <IconButton color="inherit" onClick={handleProfileMenuOpen}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              <AccountCircleIcon />
            </Avatar>
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
