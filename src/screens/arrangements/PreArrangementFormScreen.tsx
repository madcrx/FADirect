import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  SegmentedButtons,
  Checkbox,
  RadioButton,
  Divider,
} from 'react-native-paper';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { preArrangementFormsApi, PreArrangementForm } from '@services/api';
import { format } from 'date-fns';

type RouteParams = {
  PreArrangementForm: {
    arrangementId: string;
  };
};

export default function PreArrangementFormScreen() {
  const route = useRoute<RouteProp<RouteParams, 'PreArrangementForm'>>();
  const navigation = useNavigation();
  const [form, setForm] = useState<PreArrangementForm | null>(null);
  const [formData, setFormData] = useState<any>({
    deceased: {},
    nextOfKin: {},
    funeralPreferences: {},
    burialCremation: {},
    serviceContent: {},
    coffinSelection: {},
    confirmation: {},
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadForm();
  }, []);

  const loadForm = async () => {
    try {
      const formResponse = await preArrangementFormsApi.getByArrangement(
        route.params.arrangementId
      );
      setForm(formResponse);
      if (formResponse.formData) {
        setFormData(formResponse.formData);
      }
    } catch (error) {
      console.error('Failed to load form:', error);
      Alert.alert('Error', 'Failed to load pre-arrangement form');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form) return;
    try {
      await preArrangementFormsApi.updateForm(form.id, formData, 'in_progress');
      Alert.alert('Success', 'Draft saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft');
    }
  };

  const handleSubmit = async () => {
    if (!form) return;

    if (!formData.confirmation?.confirmed) {
      Alert.alert('Error', 'Please confirm the information before submitting');
      return;
    }

    try {
      setSubmitting(true);
      await preArrangementFormsApi.updateForm(form.id, formData, 'completed');
      Alert.alert(
        'Success',
        'Pre-Arrangement Form submitted successfully! The funeral home has been notified.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit form');
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading form...</Text>
      </View>
    );
  }

  if (!form) {
    return (
      <View style={styles.errorContainer}>
        <Text>No pre-arrangement form found</Text>
        <Button onPress={() => navigation.goBack()}>Go Back</Button>
      </View>
    );
  }

  const isCompleted = form.status === 'completed';

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="headlineMedium" style={styles.title}>
            Pre-Arrangement Form
          </Text>
          {isCompleted && (
            <Text style={styles.completedText}>
              Completed on {format(new Date(form.completedAt!), 'dd MMM yyyy')}
            </Text>
          )}
        </Card.Content>
      </Card>

      {/* Section 1: Deceased Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            1. Deceased Details
          </Text>
          <TextInput
            label="Full Name *"
            value={formData.deceased?.fullName || ''}
            onChangeText={(text) => updateField('deceased', 'fullName', text)}
            mode="outlined"
            style={styles.input}
            disabled={isCompleted}
          />
          <TextInput
            label="Date of Birth"
            value={formData.deceased?.dateOfBirth || ''}
            onChangeText={(text) => updateField('deceased', 'dateOfBirth', text)}
            mode="outlined"
            style={styles.input}
            placeholder="YYYY-MM-DD"
            disabled={isCompleted}
          />
          <TextInput
            label="Date of Death"
            value={formData.deceased?.dateOfDeath || ''}
            onChangeText={(text) => updateField('deceased', 'dateOfDeath', text)}
            mode="outlined"
            style={styles.input}
            placeholder="YYYY-MM-DD"
            disabled={isCompleted}
          />
          <Text style={styles.label}>Gender</Text>
          <RadioButton.Group
            onValueChange={(value) => updateField('deceased', 'gender', value)}
            value={formData.deceased?.gender || ''}
          >
            <View style={styles.radioRow}>
              <RadioButton.Item label="Male" value="male" disabled={isCompleted} />
              <RadioButton.Item label="Female" value="female" disabled={isCompleted} />
              <RadioButton.Item label="Other" value="other" disabled={isCompleted} />
            </View>
          </RadioButton.Group>
          <TextInput
            label="Occupation"
            value={formData.deceased?.occupation || ''}
            onChangeText={(text) => updateField('deceased', 'occupation', text)}
            mode="outlined"
            style={styles.input}
            disabled={isCompleted}
          />
          <TextInput
            label="Religion"
            value={formData.deceased?.religion || ''}
            onChangeText={(text) => updateField('deceased', 'religion', text)}
            mode="outlined"
            style={styles.input}
            disabled={isCompleted}
          />
        </Card.Content>
      </Card>

      {/* Section 2: Next of Kin */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            2. Next of Kin Details
          </Text>
          <TextInput
            label="Full Name *"
            value={formData.nextOfKin?.fullName || ''}
            onChangeText={(text) => updateField('nextOfKin', 'fullName', text)}
            mode="outlined"
            style={styles.input}
            disabled={isCompleted}
          />
          <TextInput
            label="Relationship *"
            value={formData.nextOfKin?.relationship || ''}
            onChangeText={(text) => updateField('nextOfKin', 'relationship', text)}
            mode="outlined"
            style={styles.input}
            disabled={isCompleted}
          />
          <TextInput
            label="Phone *"
            value={formData.nextOfKin?.phone || ''}
            onChangeText={(text) => updateField('nextOfKin', 'phone', text)}
            mode="outlined"
            style={styles.input}
            keyboardType="phone-pad"
            disabled={isCompleted}
          />
          <TextInput
            label="Email"
            value={formData.nextOfKin?.email || ''}
            onChangeText={(text) => updateField('nextOfKin', 'email', text)}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            disabled={isCompleted}
          />
        </Card.Content>
      </Card>

      {/* Section 3: Funeral Preferences */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            3. Funeral Preferences
          </Text>
          <Text style={styles.label}>Service Type *</Text>
          <SegmentedButtons
            value={formData.funeralPreferences?.serviceType || ''}
            onValueChange={(value) => updateField('funeralPreferences', 'serviceType', value)}
            buttons={[
              { value: 'Burial', label: 'Burial' },
              { value: 'Cremation', label: 'Cremation' },
              { value: 'Memorial Service', label: 'Memorial' },
            ]}
            style={styles.segmented}
            disabled={isCompleted}
          />
          <TextInput
            label="Service Location"
            value={formData.funeralPreferences?.serviceLocation || ''}
            onChangeText={(text) => updateField('funeralPreferences', 'serviceLocation', text)}
            mode="outlined"
            style={styles.input}
            disabled={isCompleted}
          />
          <TextInput
            label="Preferred Date"
            value={formData.funeralPreferences?.preferredDate || ''}
            onChangeText={(text) => updateField('funeralPreferences', 'preferredDate', text)}
            mode="outlined"
            style={styles.input}
            placeholder="YYYY-MM-DD"
            disabled={isCompleted}
          />
          <TextInput
            label="Special Requests"
            value={formData.funeralPreferences?.specialRequests || ''}
            onChangeText={(text) => updateField('funeralPreferences', 'specialRequests', text)}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            disabled={isCompleted}
          />
        </Card.Content>
      </Card>

      {/* Section 4: Service Content */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            4. Service Content
          </Text>
          <TextInput
            label="Officiant Preference"
            value={formData.serviceContent?.officiant || ''}
            onChangeText={(text) => updateField('serviceContent', 'officiant', text)}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Religious minister, celebrant, family member"
            disabled={isCompleted}
          />
          <TextInput
            label="Music Selections"
            value={formData.serviceContent?.music || ''}
            onChangeText={(text) => updateField('serviceContent', 'music', text)}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            placeholder="List songs or hymns"
            disabled={isCompleted}
          />
          <TextInput
            label="Readings"
            value={formData.serviceContent?.readings || ''}
            onChangeText={(text) => updateField('serviceContent', 'readings', text)}
            mode="outlined"
            style={styles.input}
            multiline
            numberOfLines={3}
            placeholder="Poems, scripture, etc."
            disabled={isCompleted}
          />
        </Card.Content>
      </Card>

      {/* Confirmation Section */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Confirmation
          </Text>
          <Checkbox.Item
            label="I confirm that all information provided is accurate to the best of my knowledge"
            status={formData.confirmation?.confirmed ? 'checked' : 'unchecked'}
            onPress={() =>
              updateField('confirmation', 'confirmed', !formData.confirmation?.confirmed)
            }
            disabled={isCompleted}
          />
          <TextInput
            label="Full Name (for signature)"
            value={formData.confirmation?.fullName || ''}
            onChangeText={(text) => updateField('confirmation', 'fullName', text)}
            mode="outlined"
            style={styles.input}
            disabled={isCompleted}
          />
        </Card.Content>
      </Card>

      {!isCompleted && (
        <View style={styles.actions}>
          <Button mode="outlined" onPress={handleSave} style={styles.button}>
            Save Draft
          </Button>
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.button}
            disabled={!formData.confirmation?.confirmed || submitting}
            loading={submitting}
          >
            Submit Form
          </Button>
        </View>
      )}

      {isCompleted && (
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.completedMessage}>
              Thank you for submitting the pre-arrangement form. The funeral home will review your
              information and contact you if any clarification is needed.
            </Text>
          </Card.Content>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  title: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  completedText: {
    color: '#4caf50',
    fontWeight: '600',
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  input: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  radioRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  segmented: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  button: {
    flex: 1,
  },
  completedMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
});
