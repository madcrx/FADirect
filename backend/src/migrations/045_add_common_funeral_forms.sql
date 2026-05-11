-- Add common funeral business form templates
-- Based on industry research and standard practices

-- 1. INCIDENT REPORT
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'Incident Report',
  'Document workplace incidents, accidents, near-misses, and safety concerns',
  'incident_report',
  '{
    "sections": [
      {
        "id": "incident_details",
        "title": "Incident Details",
        "fields": [
          {"name": "incidentDate", "label": "Date of Incident", "type": "date", "required": true},
          {"name": "incidentTime", "label": "Time of Incident", "type": "time", "required": true},
          {"name": "incidentLocation", "label": "Location", "type": "text", "required": true, "placeholder": "e.g., Preparation room, Chapel, Parking lot"},
          {"name": "incidentType", "label": "Incident Type", "type": "select", "required": true, "options": ["Injury", "Near Miss", "Property Damage", "Equipment Failure", "Safety Hazard", "Other"]},
          {"name": "severity", "label": "Severity", "type": "select", "required": true, "options": ["Minor", "Moderate", "Serious", "Critical"]}
        ]
      },
      {
        "id": "people_involved",
        "title": "People Involved",
        "fields": [
          {"name": "reporterName", "label": "Reporter Name", "type": "text", "required": true},
          {"name": "reporterRole", "label": "Reporter Role", "type": "text", "required": true},
          {"name": "injuredPersonName", "label": "Injured Person Name", "type": "text"},
          {"name": "witnessNames", "label": "Witness Names", "type": "textarea", "placeholder": "List all witnesses"},
          {"name": "injuryDescription", "label": "Injury Description", "type": "textarea"},
          {"name": "medicalTreatment", "label": "Medical Treatment Required", "type": "select", "options": ["None", "First Aid", "Medical Attention", "Hospitalization"]}
        ]
      },
      {
        "id": "incident_description",
        "title": "Incident Description",
        "fields": [
          {"name": "description", "label": "Detailed Description", "type": "textarea", "required": true, "placeholder": "Describe what happened in detail"},
          {"name": "rootCause", "label": "Root Cause", "type": "textarea", "placeholder": "What caused this incident?"},
          {"name": "contributingFactors", "label": "Contributing Factors", "type": "textarea"}
        ]
      },
      {
        "id": "corrective_actions",
        "title": "Corrective Actions",
        "fields": [
          {"name": "immediateActions", "label": "Immediate Actions Taken", "type": "textarea", "required": true},
          {"name": "preventiveMeasures", "label": "Preventive Measures", "type": "textarea", "placeholder": "Steps to prevent recurrence"},
          {"name": "followUpRequired", "label": "Follow-up Required", "type": "checkbox"},
          {"name": "followUpDate", "label": "Follow-up Date", "type": "date"},
          {"name": "assignedTo", "label": "Assigned To", "type": "text"}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- 2. EXPENSE CLAIM
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'Expense Claim Form',
  'Submit expense claims for reimbursement',
  'expense_claim',
  '{
    "sections": [
      {
        "id": "claimant_details",
        "title": "Claimant Details",
        "fields": [
          {"name": "employeeName", "label": "Employee Name", "type": "text", "required": true},
          {"name": "employeeId", "label": "Employee ID", "type": "text", "required": true},
          {"name": "department", "label": "Department", "type": "text", "required": true},
          {"name": "claimDate", "label": "Claim Date", "type": "date", "required": true}
        ]
      },
      {
        "id": "expense_details",
        "title": "Expense Details",
        "fields": [
          {"name": "expenseType", "label": "Expense Type", "type": "select", "required": true, "options": ["Travel", "Meals", "Accommodation", "Vehicle", "Supplies", "Equipment", "Training", "Client Entertainment", "Other"]},
          {"name": "expenseDate", "label": "Date of Expense", "type": "date", "required": true},
          {"name": "amount", "label": "Amount", "type": "number", "required": true, "placeholder": "0.00"},
          {"name": "currency", "label": "Currency", "type": "select", "options": ["AUD", "USD", "GBP", "EUR"]},
          {"name": "description", "label": "Description", "type": "textarea", "required": true, "placeholder": "Provide detailed description of expense"},
          {"name": "businessPurpose", "label": "Business Purpose", "type": "textarea", "required": true, "placeholder": "Explain business justification"}
        ]
      },
      {
        "id": "travel_details",
        "title": "Travel Details (if applicable)",
        "fields": [
          {"name": "travelFrom", "label": "Travel From", "type": "text"},
          {"name": "travelTo", "label": "Travel To", "type": "text"},
          {"name": "distanceKm", "label": "Distance (km)", "type": "number"},
          {"name": "vehicleType", "label": "Vehicle Type", "type": "select", "options": ["Personal Vehicle", "Company Vehicle", "Rental", "Public Transport", "Taxi/Uber"]}
        ]
      },
      {
        "id": "receipts",
        "title": "Supporting Documentation",
        "fields": [
          {"name": "receiptAttached", "label": "Receipt/Invoice Attached", "type": "checkbox", "required": true},
          {"name": "receiptNumber", "label": "Receipt/Invoice Number", "type": "text"},
          {"name": "additionalNotes", "label": "Additional Notes", "type": "textarea"}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- 3. MAINTENANCE REQUEST
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'Maintenance Request',
  'Report facility, equipment, or vehicle maintenance needs',
  'maintenance_request',
  '{
    "sections": [
      {
        "id": "request_details",
        "title": "Request Details",
        "fields": [
          {"name": "requestDate", "label": "Request Date", "type": "date", "required": true},
          {"name": "requestedBy", "label": "Requested By", "type": "text", "required": true},
          {"name": "priority", "label": "Priority", "type": "select", "required": true, "options": ["Emergency", "Urgent", "High", "Medium", "Low"]},
          {"name": "maintenanceType", "label": "Maintenance Type", "type": "select", "required": true, "options": ["Facility", "Equipment", "Vehicle", "HVAC", "Plumbing", "Electrical", "Other"]}
        ]
      },
      {
        "id": "item_details",
        "title": "Item/Location Details",
        "fields": [
          {"name": "location", "label": "Location", "type": "text", "required": true, "placeholder": "e.g., Chapel, Preparation Room, Office"},
          {"name": "equipmentName", "label": "Equipment/Item Name", "type": "text", "required": true},
          {"name": "assetNumber", "label": "Asset/Vehicle Number", "type": "text"},
          {"name": "manufacturer", "label": "Manufacturer/Model", "type": "text"}
        ]
      },
      {
        "id": "issue_description",
        "title": "Issue Description",
        "fields": [
          {"name": "problemDescription", "label": "Problem Description", "type": "textarea", "required": true, "placeholder": "Describe the issue in detail"},
          {"name": "whenNoticed", "label": "When Was Issue First Noticed", "type": "datetime", "required": true},
          {"name": "affectedOperations", "label": "Impact on Operations", "type": "textarea", "placeholder": "How does this affect daily operations?"},
          {"name": "safetyRisk", "label": "Safety Risk", "type": "select", "options": ["None", "Low", "Medium", "High", "Critical"]}
        ]
      },
      {
        "id": "additional_info",
        "title": "Additional Information",
        "fields": [
          {"name": "previousRepairs", "label": "Previous Repairs/Issues", "type": "textarea"},
          {"name": "warrantyCovered", "label": "Under Warranty", "type": "checkbox"},
          {"name": "preferredVendor", "label": "Preferred Service Provider", "type": "text"},
          {"name": "additionalNotes", "label": "Additional Notes", "type": "textarea"}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- 4. CUSTOMER FEEDBACK FORM
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'Customer Feedback Form',
  'Collect feedback from families about their experience',
  'customer_feedback',
  '{
    "sections": [
      {
        "id": "service_details",
        "title": "Service Details",
        "fields": [
          {"name": "deceasedName", "label": "Name of Deceased", "type": "text", "required": true},
          {"name": "serviceDate", "label": "Service Date", "type": "date", "required": true},
          {"name": "serviceType", "label": "Service Type", "type": "select", "options": ["Burial", "Cremation", "Memorial Service", "Celebration of Life"]},
          {"name": "funeralDirector", "label": "Funeral Director", "type": "text"}
        ]
      },
      {
        "id": "contact_info",
        "title": "Your Contact Information",
        "fields": [
          {"name": "respondentName", "label": "Your Name", "type": "text", "required": true},
          {"name": "relationship", "label": "Relationship to Deceased", "type": "text"},
          {"name": "email", "label": "Email", "type": "email"},
          {"name": "phone", "label": "Phone", "type": "tel"}
        ]
      },
      {
        "id": "satisfaction_ratings",
        "title": "Service Satisfaction",
        "fields": [
          {"name": "overallSatisfaction", "label": "Overall Satisfaction", "type": "select", "required": true, "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied", "Very Dissatisfied"]},
          {"name": "staffProfessionalism", "label": "Staff Professionalism", "type": "select", "required": true, "options": ["Excellent", "Good", "Average", "Below Average", "Poor"]},
          {"name": "facilityRating", "label": "Facility Rating", "type": "select", "required": true, "options": ["Excellent", "Good", "Average", "Below Average", "Poor"]},
          {"name": "communicationRating", "label": "Communication", "type": "select", "required": true, "options": ["Excellent", "Good", "Average", "Below Average", "Poor"]},
          {"name": "valueForMoney", "label": "Value for Money", "type": "select", "required": true, "options": ["Excellent", "Good", "Average", "Below Average", "Poor"]}
        ]
      },
      {
        "id": "feedback_comments",
        "title": "Additional Feedback",
        "fields": [
          {"name": "positiveExperience", "label": "What Did We Do Well?", "type": "textarea", "placeholder": "Please share what you appreciated most"},
          {"name": "improvements", "label": "How Can We Improve?", "type": "textarea", "placeholder": "Suggestions for improvement"},
          {"name": "wouldRecommend", "label": "Would You Recommend Us?", "type": "select", "required": true, "options": ["Definitely", "Probably", "Not Sure", "Probably Not", "Definitely Not"]},
          {"name": "testimonial", "label": "May We Use Your Comments as a Testimonial?", "type": "select", "options": ["Yes, with my name", "Yes, but anonymous", "No"]}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- 5. FIRST CALL REPORT
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'First Call Report',
  'Initial contact and removal report for deceased',
  'first_call_report',
  '{
    "sections": [
      {
        "id": "call_details",
        "title": "Call Details",
        "fields": [
          {"name": "callReceived", "label": "Call Received Date/Time", "type": "datetime", "required": true},
          {"name": "callerName", "label": "Caller Name", "type": "text", "required": true},
          {"name": "callerPhone", "label": "Caller Phone", "type": "tel", "required": true},
          {"name": "callerRelationship", "label": "Relationship to Deceased", "type": "text", "required": true},
          {"name": "referralSource", "label": "Referral Source", "type": "select", "options": ["Family", "Hospital", "Nursing Home", "Hospice", "Coroner", "Police", "Other"]}
        ]
      },
      {
        "id": "deceased_details",
        "title": "Deceased Information",
        "fields": [
          {"name": "deceasedFullName", "label": "Full Name", "type": "text", "required": true},
          {"name": "dateOfBirth", "label": "Date of Birth", "type": "date"},
          {"name": "dateOfDeath", "label": "Date of Death", "type": "date", "required": true},
          {"name": "timeOfDeath", "label": "Time of Death", "type": "time"},
          {"name": "age", "label": "Age", "type": "number"},
          {"name": "gender", "label": "Gender", "type": "select", "options": ["Male", "Female", "Other"]},
          {"name": "socialSecurityNumber", "label": "Social Security Number", "type": "text"}
        ]
      },
      {
        "id": "location_details",
        "title": "Location Details",
        "fields": [
          {"name": "currentLocation", "label": "Current Location of Deceased", "type": "text", "required": true, "placeholder": "Hospital, Home, Nursing facility, etc."},
          {"name": "facilityName", "label": "Facility Name", "type": "text"},
          {"name": "address", "label": "Full Address", "type": "textarea", "required": true},
          {"name": "roomNumber", "label": "Room/Unit Number", "type": "text"},
          {"name": "contactPerson", "label": "Contact Person at Location", "type": "text"},
          {"name": "contactPhone", "label": "Contact Phone", "type": "tel"}
        ]
      },
      {
        "id": "removal_details",
        "title": "Removal Details",
        "fields": [
          {"name": "removalDate", "label": "Scheduled Removal Date", "type": "date", "required": true},
          {"name": "removalTime", "label": "Scheduled Removal Time", "type": "time", "required": true},
          {"name": "staffAssigned", "label": "Staff Assigned", "type": "text"},
          {"name": "vehicleUsed", "label": "Vehicle", "type": "text"},
          {"name": "coronerCase", "label": "Coroner Case", "type": "checkbox"},
          {"name": "coronerReleaseNumber", "label": "Coroner Release Number", "type": "text"},
          {"name": "specialInstructions", "label": "Special Instructions", "type": "textarea"}
        ]
      },
      {
        "id": "medical_info",
        "title": "Medical Information",
        "fields": [
          {"name": "causeOfDeath", "label": "Cause of Death", "type": "text"},
          {"name": "attendingPhysician", "label": "Attending Physician", "type": "text"},
          {"name": "physicianPhone", "label": "Physician Phone", "type": "tel"},
          {"name": "infectiousDisease", "label": "Infectious Disease", "type": "checkbox"},
          {"name": "diseaseDetails", "label": "Disease Details", "type": "text"},
          {"name": "medicalDevices", "label": "Medical Devices (Pacemaker, etc.)", "type": "textarea"}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- 6. VEHICLE INSPECTION CHECKLIST
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'Vehicle Inspection Checklist',
  'Daily inspection checklist for funeral vehicles',
  'vehicle_inspection',
  '{
    "sections": [
      {
        "id": "vehicle_details",
        "title": "Vehicle Details",
        "fields": [
          {"name": "inspectionDate", "label": "Inspection Date", "type": "date", "required": true},
          {"name": "inspectionTime", "label": "Inspection Time", "type": "time", "required": true},
          {"name": "vehicleType", "label": "Vehicle Type", "type": "select", "required": true, "options": ["Hearse", "Limousine", "Service Vehicle", "Transfer Vehicle", "Family Car"]},
          {"name": "vehicleNumber", "label": "Vehicle Number/ID", "type": "text", "required": true},
          {"name": "licensePlate", "label": "License Plate", "type": "text", "required": true},
          {"name": "mileage", "label": "Current Mileage", "type": "number", "required": true},
          {"name": "inspectorName", "label": "Inspector Name", "type": "text", "required": true}
        ]
      },
      {
        "id": "exterior_check",
        "title": "Exterior Inspection",
        "fields": [
          {"name": "bodyCondition", "label": "Body Condition", "type": "select", "required": true, "options": ["Good", "Minor Issues", "Needs Attention"]},
          {"name": "paintCondition", "label": "Paint Condition", "type": "select", "required": true, "options": ["Good", "Minor Issues", "Needs Attention"]},
          {"name": "lightsWorking", "label": "All Lights Working", "type": "checkbox", "required": true},
          {"name": "mirrorsIntact", "label": "Mirrors Intact & Clean", "type": "checkbox", "required": true},
          {"name": "tiresCondition", "label": "Tires Condition", "type": "select", "required": true, "options": ["Good", "Acceptable", "Needs Replacement"]},
          {"name": "tirePressure", "label": "Tire Pressure Checked", "type": "checkbox", "required": true},
          {"name": "windowsClean", "label": "Windows Clean", "type": "checkbox", "required": true}
        ]
      },
      {
        "id": "interior_check",
        "title": "Interior Inspection",
        "fields": [
          {"name": "seatsClean", "label": "Seats Clean & Presentable", "type": "checkbox", "required": true},
          {"name": "carpetsClean", "label": "Carpets/Flooring Clean", "type": "checkbox", "required": true},
          {"name": "interiorOdor", "label": "Interior Odor Free", "type": "checkbox", "required": true},
          {"name": "airConditioning", "label": "Air Conditioning Working", "type": "checkbox", "required": true},
          {"name": "heatingWorking", "label": "Heating Working", "type": "checkbox", "required": true},
          {"name": "radioWorking", "label": "Radio/Sound System Working", "type": "checkbox"}
        ]
      },
      {
        "id": "mechanical_check",
        "title": "Mechanical Inspection",
        "fields": [
          {"name": "engineStarts", "label": "Engine Starts Properly", "type": "checkbox", "required": true},
          {"name": "brakesWorking", "label": "Brakes Working Properly", "type": "checkbox", "required": true},
          {"name": "steeringNormal", "label": "Steering Normal", "type": "checkbox", "required": true},
          {"name": "unusualNoises", "label": "No Unusual Noises", "type": "checkbox", "required": true},
          {"name": "fluidLevels", "label": "Fluid Levels Checked", "type": "checkbox", "required": true},
          {"name": "fuelLevel", "label": "Fuel Level", "type": "select", "required": true, "options": ["Full", "3/4", "1/2", "1/4", "Low"]}
        ]
      },
      {
        "id": "safety_equipment",
        "title": "Safety Equipment",
        "fields": [
          {"name": "firstAidKit", "label": "First Aid Kit Present", "type": "checkbox", "required": true},
          {"name": "fireExtinguisher", "label": "Fire Extinguisher Present", "type": "checkbox", "required": true},
          {"name": "emergencyTriangle", "label": "Warning Triangle Present", "type": "checkbox", "required": true},
          {"name": "spareKey", "label": "Spare Key Available", "type": "checkbox"}
        ]
      },
      {
        "id": "issues_notes",
        "title": "Issues & Notes",
        "fields": [
          {"name": "issuesFound", "label": "Issues Found", "type": "textarea", "placeholder": "Describe any issues or concerns"},
          {"name": "repairsNeeded", "label": "Repairs Needed", "type": "textarea"},
          {"name": "overallStatus", "label": "Overall Vehicle Status", "type": "select", "required": true, "options": ["Approved for Service", "Approved with Minor Issues", "Needs Repair Before Use", "Out of Service"]}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- 7. EQUIPMENT MAINTENANCE LOG
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'Equipment Maintenance Log',
  'Log routine maintenance for embalming and other equipment',
  'equipment_maintenance',
  '{
    "sections": [
      {
        "id": "equipment_details",
        "title": "Equipment Details",
        "fields": [
          {"name": "maintenanceDate", "label": "Maintenance Date", "type": "date", "required": true},
          {"name": "equipmentName", "label": "Equipment Name", "type": "text", "required": true},
          {"name": "equipmentId", "label": "Equipment ID/Serial Number", "type": "text", "required": true},
          {"name": "manufacturer", "label": "Manufacturer", "type": "text"},
          {"name": "model", "label": "Model Number", "type": "text"},
          {"name": "location", "label": "Location", "type": "text", "required": true}
        ]
      },
      {
        "id": "maintenance_type",
        "title": "Maintenance Type",
        "fields": [
          {"name": "maintenanceType", "label": "Maintenance Type", "type": "select", "required": true, "options": ["Routine/Scheduled", "Preventive", "Repair", "Calibration", "Inspection", "Emergency"]},
          {"name": "performedBy", "label": "Performed By", "type": "text", "required": true},
          {"name": "technicianName", "label": "Technician Name (if external)", "type": "text"},
          {"name": "company", "label": "Service Company", "type": "text"}
        ]
      },
      {
        "id": "maintenance_details",
        "title": "Maintenance Details",
        "fields": [
          {"name": "tasksPerformed", "label": "Tasks Performed", "type": "textarea", "required": true, "placeholder": "List all maintenance tasks completed"},
          {"name": "partsReplaced", "label": "Parts Replaced", "type": "textarea", "placeholder": "List any parts or components replaced"},
          {"name": "issuesFound", "label": "Issues Found", "type": "textarea"},
          {"name": "issuesResolved", "label": "Issues Resolved", "type": "textarea"},
          {"name": "testResults", "label": "Test Results", "type": "textarea"}
        ]
      },
      {
        "id": "next_maintenance",
        "title": "Next Maintenance",
        "fields": [
          {"name": "nextMaintenanceDate", "label": "Next Scheduled Maintenance", "type": "date"},
          {"name": "recommendations", "label": "Recommendations", "type": "textarea"},
          {"name": "estimatedCost", "label": "Estimated Cost", "type": "number"},
          {"name": "warrantyCovered", "label": "Under Warranty", "type": "checkbox"}
        ]
      },
      {
        "id": "approval",
        "title": "Approval",
        "fields": [
          {"name": "equipmentStatus", "label": "Equipment Status", "type": "select", "required": true, "options": ["Operational", "Operational with Monitoring", "Needs Follow-up", "Out of Service"]},
          {"name": "approvedBy", "label": "Approved By", "type": "text"},
          {"name": "approvalDate", "label": "Approval Date", "type": "date"}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- 8. STAFF TRAINING LOG
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'Staff Training Log',
  'Record staff training sessions and certifications',
  'staff_training',
  '{
    "sections": [
      {
        "id": "training_details",
        "title": "Training Details",
        "fields": [
          {"name": "trainingDate", "label": "Training Date", "type": "date", "required": true},
          {"name": "trainingTitle", "label": "Training Title", "type": "text", "required": true},
          {"name": "trainingType", "label": "Training Type", "type": "select", "required": true, "options": ["Orientation", "Skills Training", "Certification", "Compliance", "Safety", "Customer Service", "Technical", "Leadership", "Continuing Education"]},
          {"name": "duration", "label": "Duration (hours)", "type": "number", "required": true},
          {"name": "trainer", "label": "Trainer/Instructor", "type": "text", "required": true}
        ]
      },
      {
        "id": "participant_details",
        "title": "Participant Details",
        "fields": [
          {"name": "employeeName", "label": "Employee Name", "type": "text", "required": true},
          {"name": "employeeId", "label": "Employee ID", "type": "text", "required": true},
          {"name": "jobTitle", "label": "Job Title", "type": "text", "required": true},
          {"name": "department", "label": "Department", "type": "text"}
        ]
      },
      {
        "id": "training_content",
        "title": "Training Content",
        "fields": [
          {"name": "topicsCovered", "label": "Topics Covered", "type": "textarea", "required": true, "placeholder": "List main topics and learning objectives"},
          {"name": "materials", "label": "Training Materials Used", "type": "textarea"},
          {"name": "practicalExercises", "label": "Practical Exercises", "type": "textarea"}
        ]
      },
      {
        "id": "assessment",
        "title": "Assessment & Completion",
        "fields": [
          {"name": "assessmentCompleted", "label": "Assessment Completed", "type": "checkbox"},
          {"name": "assessmentScore", "label": "Assessment Score (%)", "type": "number"},
          {"name": "competencyAchieved", "label": "Competency Achieved", "type": "select", "options": ["Exceeds Standards", "Meets Standards", "Needs Improvement", "Not Achieved"]},
          {"name": "certificationIssued", "label": "Certification Issued", "type": "checkbox"},
          {"name": "certificateNumber", "label": "Certificate Number", "type": "text"},
          {"name": "expiryDate", "label": "Certification Expiry Date", "type": "date"}
        ]
      },
      {
        "id": "feedback",
        "title": "Feedback & Notes",
        "fields": [
          {"name": "trainerComments", "label": "Trainer Comments", "type": "textarea"},
          {"name": "employeeFeedback", "label": "Employee Feedback", "type": "textarea"},
          {"name": "followUpRequired", "label": "Follow-up Required", "type": "checkbox"},
          {"name": "followUpNotes", "label": "Follow-up Notes", "type": "textarea"}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- 9. HEALTH & SAFETY CHECKLIST
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'Health & Safety Checklist',
  'Monthly health and safety inspection checklist',
  'health_safety_checklist',
  '{
    "sections": [
      {
        "id": "inspection_details",
        "title": "Inspection Details",
        "fields": [
          {"name": "inspectionDate", "label": "Inspection Date", "type": "date", "required": true},
          {"name": "inspectorName", "label": "Inspector Name", "type": "text", "required": true},
          {"name": "inspectorTitle", "label": "Inspector Title", "type": "text", "required": true},
          {"name": "areaInspected", "label": "Area/Department Inspected", "type": "text", "required": true}
        ]
      },
      {
        "id": "fire_safety",
        "title": "Fire Safety",
        "fields": [
          {"name": "fireExtinguishers", "label": "Fire Extinguishers Inspected & Tagged", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "smokeDetectors", "label": "Smoke Detectors Tested", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "emergencyExits", "label": "Emergency Exits Clear & Marked", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "evacuationPlan", "label": "Evacuation Plan Posted", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "fireAlarm", "label": "Fire Alarm System Functional", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]}
        ]
      },
      {
        "id": "ppe_equipment",
        "title": "Personal Protective Equipment",
        "fields": [
          {"name": "glovesAvailable", "label": "Gloves Available & In Stock", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "masksAvailable", "label": "Masks/Respirators Available", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "eyewearAvailable", "label": "Eye Protection Available", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "apronsGowns", "label": "Aprons/Gowns Available", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "ppeStorage", "label": "PPE Properly Stored", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]}
        ]
      },
      {
        "id": "chemical_safety",
        "title": "Chemical Safety",
        "fields": [
          {"name": "sdsAvailable", "label": "SDS Sheets Available & Current", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "chemicalsLabeled", "label": "All Chemicals Properly Labeled", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "chemicalStorage", "label": "Chemicals Stored Correctly", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "spillKit", "label": "Spill Kit Available & Stocked", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "eyewashStation", "label": "Eyewash Station Functional", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]}
        ]
      },
      {
        "id": "facility_safety",
        "title": "Facility Safety",
        "fields": [
          {"name": "floorCondition", "label": "Floors Clean & Dry (No Trip Hazards)", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "lightingAdequate", "label": "Lighting Adequate", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "ventilation", "label": "Ventilation Systems Working", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "electricalSafety", "label": "Electrical Cords & Outlets Safe", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]},
          {"name": "wasteDisposal", "label": "Waste Disposal Proper (Including Biohazard)", "type": "select", "required": true, "options": ["Pass", "Fail", "N/A"]}
        ]
      },
      {
        "id": "summary",
        "title": "Summary & Actions",
        "fields": [
          {"name": "hazardsIdentified", "label": "Hazards Identified", "type": "textarea", "placeholder": "List any hazards or concerns found"},
          {"name": "correctiveActions", "label": "Corrective Actions Required", "type": "textarea", "required": true},
          {"name": "actionAssignedTo", "label": "Actions Assigned To", "type": "text"},
          {"name": "targetDate", "label": "Target Completion Date", "type": "date"},
          {"name": "overallStatus", "label": "Overall Safety Status", "type": "select", "required": true, "options": ["Satisfactory", "Needs Minor Improvements", "Needs Immediate Action", "Critical Issues"]}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- 10. EMBALMING CASE REPORT
INSERT INTO form_templates (name, description, form_type, template_data, is_active)
VALUES (
  'Embalming Case Report',
  'Detailed embalming case documentation for regulatory compliance',
  'embalming_report',
  '{
    "sections": [
      {
        "id": "case_details",
        "title": "Case Details",
        "fields": [
          {"name": "caseNumber", "label": "Case Number", "type": "text", "required": true},
          {"name": "embalmingDate", "label": "Embalming Date", "type": "date", "required": true},
          {"name": "embalmingTime", "label": "Embalming Time Started", "type": "time", "required": true},
          {"name": "embalmer", "label": "Embalmer Name", "type": "text", "required": true},
          {"name": "embalmerLicense", "label": "Embalmer License Number", "type": "text", "required": true},
          {"name": "facilityName", "label": "Facility Name", "type": "text", "required": true}
        ]
      },
      {
        "id": "deceased_information",
        "title": "Deceased Information",
        "fields": [
          {"name": "deceasedName", "label": "Full Name", "type": "text", "required": true},
          {"name": "age", "label": "Age", "type": "number", "required": true},
          {"name": "gender", "label": "Gender", "type": "select", "required": true, "options": ["Male", "Female", "Other"]},
          {"name": "dateOfDeath", "label": "Date of Death", "type": "date", "required": true},
          {"name": "timeOfDeath", "label": "Time of Death", "type": "time"},
          {"name": "causeOfDeath", "label": "Cause of Death", "type": "text", "required": true},
          {"name": "placeOfDeath", "label": "Place of Death", "type": "text", "required": true}
        ]
      },
      {
        "id": "body_condition",
        "title": "Body Condition Assessment",
        "fields": [
          {"name": "timeOfRemoval", "label": "Time of Removal from Place of Death", "type": "datetime", "required": true},
          {"name": "timeReceived", "label": "Time Received at Facility", "type": "datetime", "required": true},
          {"name": "postmortemInterval", "label": "Postmortem Interval (hours)", "type": "number"},
          {"name": "bodyWeight", "label": "Body Weight (kg)", "type": "number"},
          {"name": "rigorMortis", "label": "Rigor Mortis", "type": "select", "options": ["None", "Slight", "Moderate", "Advanced", "Complete"]},
          {"name": "decomposition", "label": "Decomposition Level", "type": "select", "options": ["None", "Minimal", "Moderate", "Advanced"]},
          {"name": "autopsyPerformed", "label": "Autopsy Performed", "type": "checkbox"},
          {"name": "infectiousDisease", "label": "Infectious Disease Present", "type": "checkbox"},
          {"name": "diseaseDetails", "label": "Disease Details", "type": "text"}
        ]
      },
      {
        "id": "embalming_procedure",
        "title": "Embalming Procedure",
        "fields": [
          {"name": "arterialInjection", "label": "Arterial Injection Site", "type": "select", "required": true, "options": ["Right Common Carotid", "Left Common Carotid", "Femoral", "Axillary", "Other"]},
          {"name": "drainagePoint", "label": "Drainage Point", "type": "select", "required": true, "options": ["Jugular", "Femoral", "Other"]},
          {"name": "fluidUsed", "label": "Embalming Fluid Used", "type": "text", "required": true},
          {"name": "fluidIndex", "label": "Fluid Index", "type": "number"},
          {"name": "volumeInjected", "label": "Volume Injected (oz)", "type": "number", "required": true},
          {"name": "pressure", "label": "Pressure Used (psi)", "type": "number"},
          {"name": "cavityTreatment", "label": "Cavity Treatment Performed", "type": "checkbox"},
          {"name": "cavityFluid", "label": "Cavity Fluid Used", "type": "text"},
          {"name": "cavityFluidVolume", "label": "Cavity Fluid Volume (oz)", "type": "number"}
        ]
      },
      {
        "id": "restorative_work",
        "title": "Restorative Work",
        "fields": [
          {"name": "washingHair", "label": "Washing & Hair", "type": "checkbox"},
          {"name": "shaving", "label": "Shaving", "type": "checkbox"},
          {"name": "cosmeticsApplied", "label": "Cosmetics Applied", "type": "checkbox"},
          {"name": "restorativeWork", "label": "Restorative Work Performed", "type": "textarea"},
          {"name": "dressing", "label": "Dressing Completed", "type": "checkbox"}
        ]
      },
      {
        "id": "completion",
        "title": "Completion & Authorization",
        "fields": [
          {"name": "completionTime", "label": "Completion Time", "type": "time", "required": true},
          {"name": "totalDuration", "label": "Total Duration (hours)", "type": "number"},
          {"name": "complications", "label": "Complications/Issues", "type": "textarea"},
          {"name": "authorizingAgent", "label": "Authorizing Agent Name", "type": "text", "required": true},
          {"name": "agentRelationship", "label": "Relationship to Deceased", "type": "text", "required": true},
          {"name": "agentPhone", "label": "Agent Phone", "type": "tel"},
          {"name": "permissionDate", "label": "Permission Obtained Date/Time", "type": "datetime", "required": true}
        ]
      }
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- Add comments
COMMENT ON TABLE form_templates IS 'Extended with comprehensive funeral business form templates including incident reports, expense claims, maintenance requests, customer feedback, first call reports, vehicle inspections, equipment maintenance, staff training, health & safety checklists, and embalming reports';
