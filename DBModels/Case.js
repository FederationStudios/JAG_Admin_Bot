const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema({
  case_id: {
    type: String,
    required: true,
    unique: true,
  },
  roblox_username: {
    iv: { type: String, required: true },
    encryptedData: { type: String, required: true }
  },
  discord_username: {
    iv: { type: String, required: true },
    encryptedData: { type: String, required: true }
  },
  division: {
    type: String,
    required: true,
    enum: [
      '3rd Guards Tanks',
      '98th Airborne Division',
      '1st Shock Infantry',
      'Foreign Operations Department',
      'Imperial Special Operations Command',
      'Imperial Guard',
      'Military Police',
      'Military Training Academy',
      'Quartermaster',
      'Administrative & Community Services',
      'Military Wide'
    ],
  },
  prosecuting_authority: {
    type: String,
    required: true,
    enum: [
      'Special Authority',
      'Commanding Officer',
      'Military Police',
      'High Command',
      'Supreme Command'
    ],
  },
  appeal_type: { 
    type: String,
    required: true,
    enum: [
      'Summary Appeal Court',
      'General Appeal Court',
      'Appeal Tribunal',
    ],
  },
  offenses_adjudicated: {
    type: String,
    required: true,
  },
  judges_assigned: {
    type: Boolean,
    default: false,
  },
  judges_username: { 
    type: [String],
    default: [],
  },
  submission_date: {
    type: Date,
    default: Date.now,
  },
  case_status: {
    type: String,
    required: true,
    enum: [
      'Pending',
      'Denied',
      'Accepted',
      'Awaiting Assignment of Judge',
      'Awaiting Approval from JAG Command',
      'Case Ended',
      'Results Declared'
    ],
    default: 'Pending',
  },
});

const Case = mongoose.model('Case', caseSchema);

module.exports = Case;
