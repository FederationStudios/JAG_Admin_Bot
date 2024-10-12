const mongoose = require('mongoose');

// Define the schema for the judgment document
const judgmentSchema = new mongoose.Schema({
  case_id: {
    type: String,
    required: true,
    unique: true, // Ensures each case_id has only one judgment document
  },
  result_doc_link: {
    type: String,
    required: true, // Link to the Google Doc for the judgment
  },
  submitted_date: {
    type: Date,
    default: Date.now,
  }
});

// Create a model from the schema
const Judgment = mongoose.model('Judgment', judgmentSchema);

module.exports = Judgment;
