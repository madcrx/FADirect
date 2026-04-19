import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  FAB,
  Chip,
  Portal,
  Dialog,
  Button,
  TextInput,
  SegmentedButtons,
} from 'react-native-paper';
import { format } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { leaveApi, Leave } from '@services/api';
import { useSelector } from 'react-redux';
import { RootState } from '@store/index';

export default function LeaveScreen() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [createDialogVisible, setCreateDialogVisible] = useState(false);
  const [newLeave, setNewLeave] = useState({
    startDate: new Date(),
    endDate: new Date(),
    leaveType: 'annual' as Leave['leaveType'],
    reason: '',
  });
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const user = useSelector((state: RootState) => state.auth.user);
  const isArranger = user?.role?.includes('arranger');

  useEffect(() => {
    loadLeaves();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [leaves, filter]);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = isArranger
        ? await leaveApi.getAllLeave()
        : await leaveApi.getMyLeave();
      setLeaves(data);
    } catch (error) {
      console.error('Failed to load leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadLeaves();
    setRefreshing(false);
  };

  const applyFilter = () => {
    if (filter === 'all') {
      setFilteredLeaves(leaves);
    } else {
      setFilteredLeaves(leaves.filter(leave => leave.status === filter));
    }
  };

  const handleCreateLeave = async () => {
    if (!newLeave.reason.trim() || !user?.id) return;

    try {
      setSubmitting(true);
      await leaveApi.createLeave(user.id, {
        startDate: newLeave.startDate.toISOString(),
        endDate: newLeave.endDate.toISOString(),
        leaveType: newLeave.leaveType,
        reason: newLeave.reason,
        status: 'pending',
      });
      setCreateDialogVisible(false);
      setNewLeave({
        startDate: new Date(),
        endDate: new Date(),
        leaveType: 'annual',
        reason: '',
      });
      await loadLeaves();
    } catch (error) {
      console.error('Failed to create leave:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (leave: Leave) => {
    if (!leave.staffId) return;
    try {
      await leaveApi.updateLeaveStatus(leave.staffId, leave.id, 'approved');
      await loadLeaves();
    } catch (error) {
      console.error('Failed to approve leave:', error);
    }
  };

  const handleReject = async (leave: Leave) => {
    if (!leave.staffId) return;
    try {
      await leaveApi.updateLeaveStatus(leave.staffId, leave.id, 'rejected');
      await loadLeaves();
    } catch (error) {
      console.error('Failed to reject leave:', error);
    }
  };

  const getStatusColor = (status: Leave['status']) => {
    switch (status) {
      case 'approved': return '#4caf50';
      case 'rejected': return '#f44336';
      case 'cancelled': return '#9e9e9e';
      default: return '#ff9800';
    }
  };

  const getLeaveTypeLabel = (type: Leave['leaveType']) => {
    const labels = {
      annual: 'Annual Leave',
      sick: 'Sick Leave',
      personal: 'Personal Leave',
      unpaid: 'Unpaid Leave',
      bereavement: 'Bereavement Leave',
      other: 'Other',
    };
    return labels[type] || type;
  };

  const renderLeaveItem = ({ item }: { item: Leave }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            {isArranger && item.staffName && (
              <Text style={styles.staffName}>{item.staffName}</Text>
            )}
            <Text style={styles.leaveType}>{getLeaveTypeLabel(item.leaveType)}</Text>
          </View>
          <Chip
            style={[styles.statusChip, { backgroundColor: getStatusColor(item.status) }]}
            textStyle={styles.statusText}
          >
            {item.status}
          </Chip>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.label}>From:</Text>
          <Text style={styles.date}>{format(new Date(item.startDate), 'dd MMM yyyy')}</Text>
        </View>
        <View style={styles.dateRow}>
          <Text style={styles.label}>To:</Text>
          <Text style={styles.date}>{format(new Date(item.endDate), 'dd MMM yyyy')}</Text>
        </View>

        {item.reason && (
          <View style={styles.reasonContainer}>
            <Text style={styles.label}>Reason:</Text>
            <Text style={styles.reason}>{item.reason}</Text>
          </View>
        )}

        {isArranger && item.status === 'pending' && (
          <View style={styles.actions}>
            <Button
              mode="contained"
              onPress={() => handleApprove(item)}
              style={styles.approveButton}
              buttonColor="#4caf50"
            >
              Approve
            </Button>
            <Button
              mode="outlined"
              onPress={() => handleReject(item)}
              style={styles.rejectButton}
              textColor="#f44336"
            >
              Reject
            </Button>
          </View>
        )}

        {item.approvedBy && item.approverName && (
          <Text style={styles.approver}>
            {item.status === 'approved' ? 'Approved' : 'Rejected'} by {item.approverName}
          </Text>
        )}
      </Card.Content>
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        <SegmentedButtons
          value={filter}
          onValueChange={setFilter}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'approved', label: 'Approved' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
      </View>

      <FlatList
        data={filteredLeaves}
        renderItem={renderLeaveItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {filter === 'all' ? 'No leave requests' : `No ${filter} requests`}
            </Text>
          </View>
        }
      />

      {!isArranger && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={() => setCreateDialogVisible(true)}
        />
      )}

      <Portal>
        <Dialog visible={createDialogVisible} onDismiss={() => setCreateDialogVisible(false)}>
          <Dialog.Title>Request Leave</Dialog.Title>
          <Dialog.Content>
            <SegmentedButtons
              value={newLeave.leaveType}
              onValueChange={(value) => setNewLeave({ ...newLeave, leaveType: value as Leave['leaveType'] })}
              buttons={[
                { value: 'annual', label: 'Annual' },
                { value: 'sick', label: 'Sick' },
                { value: 'personal', label: 'Personal' },
                { value: 'unpaid', label: 'Unpaid' },
              ]}
              style={styles.typeSelector}
            />

            <TouchableOpacity onPress={() => setShowStartPicker(true)}>
              <TextInput
                label="Start Date"
                value={format(newLeave.startDate, 'dd MMM yyyy')}
                editable={false}
                mode="outlined"
                style={styles.input}
                right={<TextInput.Icon icon="calendar" />}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowEndPicker(true)}>
              <TextInput
                label="End Date"
                value={format(newLeave.endDate, 'dd MMM yyyy')}
                editable={false}
                mode="outlined"
                style={styles.input}
                right={<TextInput.Icon icon="calendar" />}
              />
            </TouchableOpacity>

            <TextInput
              label="Reason"
              value={newLeave.reason}
              onChangeText={(text) => setNewLeave({ ...newLeave, reason: text })}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            {showStartPicker && (
              <DateTimePicker
                value={newLeave.startDate}
                mode="date"
                onChange={(event, date) => {
                  setShowStartPicker(false);
                  if (date) setNewLeave({ ...newLeave, startDate: date });
                }}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={newLeave.endDate}
                mode="date"
                onChange={(event, date) => {
                  setShowEndPicker(false);
                  if (date) setNewLeave({ ...newLeave, endDate: date });
                }}
              />
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setCreateDialogVisible(false)}>Cancel</Button>
            <Button
              onPress={handleCreateLeave}
              disabled={!newLeave.reason.trim() || submitting}
              loading={submitting}
            >
              Submit
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  leaveType: {
    fontSize: 14,
    color: '#666',
  },
  statusChip: {
    height: 28,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 8,
    color: '#666',
  },
  date: {
    fontSize: 14,
    color: '#000',
  },
  reasonContainer: {
    marginTop: 8,
  },
  reason: {
    fontSize: 14,
    color: '#000',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 8,
  },
  approveButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
  },
  approver: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
  typeSelector: {
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
});
