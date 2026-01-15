import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Text, TextInput, Button, HelperText, SegmentedButtons } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { ArrangementStackParamList, RootState, FuneralType } from '@types/index';
import { ArrangementService } from '@services/arrangements/arrangementService';
import { addArrangement } from '@store/slices/arrangementsSlice';
import { theme } from '@utils/theme';

type CreateArrangementScreenNavigationProp = StackNavigationProp<
  ArrangementStackParamList,
  'CreateArrangement'
>;

const CreateArrangementScreen = () => {
  const navigation = useNavigation<CreateArrangementScreenNavigationProp>();
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);

  const [deceasedName, setDeceasedName] = useState('');
  const [mournerPhone, setMournerPhone] = useState('');
  const [funeralType, setFuneralType] = useState<FuneralType>('traditional');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    setError('');

    if (!deceasedName.trim()) {
      setError('Please enter the name of the deceased');
      return;
    }

    if (!mournerPhone.trim()) {
      setError('Please enter the mourner\'s phone number');
      return;
    }

    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      // TODO: Search for mourner by phone number
      // For now, use mourner phone as ID (would need proper user lookup)
      const mournerId = mournerPhone; // Temporary

      const arrangement = await ArrangementService.createArrangement({
        arrangerId: user.id,
        mournerId,
        deceasedName: deceasedName.trim(),
        funeralType,
      });

      dispatch(addArrangement(arrangement));
      navigation.goBack();
    } catch (err: any) {
      setError(err.message || 'Failed to create arrangement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Deceased Information
          </Text>

          <TextInput
            label="Name of Deceased"
            value={deceasedName}
            onChangeText={setDeceasedName}
            mode="outlined"
            disabled={loading}
            style={styles.input}
            autoCapitalize="words"
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Family Contact
          </Text>

          <TextInput
            label="Mourner's Phone Number"
            value={mournerPhone}
            onChangeText={setMournerPhone}
            mode="outlined"
            keyboardType="phone-pad"
            disabled={loading}
            style={styles.input}
            placeholder="04XX XXX XXX"
            helperText="The family member will receive an invitation to FA Direct"
          />

          <Text variant="titleMedium" style={styles.sectionTitle}>
            Service Type
          </Text>

          <SegmentedButtons
            value={funeralType}
            onValueChange={value => setFuneralType(value as FuneralType)}
            buttons={[
              { value: 'traditional', label: 'Traditional' },
              { value: 'cremation', label: 'Cremation' },
              { value: 'burial', label: 'Burial' },
            ]}
            style={styles.segmentedButtons}
          />

          <SegmentedButtons
            value={funeralType}
            onValueChange={value => setFuneralType(value as FuneralType)}
            buttons={[
              { value: 'repatriation', label: 'Repatriation' },
              { value: 'memorial', label: 'Memorial' },
              { value: 'direct_cremation', label: 'Direct' },
            ]}
            style={styles.segmentedButtons}
          />

          <HelperText type="error" visible={!!error}>
            {error}
          </HelperText>

          <Button
            mode="contained"
            onPress={handleCreate}
            loading={loading}
            disabled={loading}
            style={styles.button}>
            Create Arrangement
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: theme.spacing.lg,
  },
  sectionTitle: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    color: theme.colors.onBackground,
  },
  input: {
    marginBottom: theme.spacing.md,
  },
  segmentedButtons: {
    marginBottom: theme.spacing.md,
  },
  button: {
    marginTop: theme.spacing.lg,
  },
});

export default CreateArrangementScreen;
