const mongoose = require('mongoose');

// Define the schema for the judgment document
const judgmentSchema = new mongoose.Schema({
  case_id: {
    type: String,
    required: true,
    unique: true, 
  },
  result_doc_link: {
    type: String,
    required: true,
    match: /^https?:\/\/.+/  // Must be a valid http or https link
  },
  submitted_date: {
    type: Date,
    default: Date.now,
  }
});

// Create a model from the schema
const Judgment = mongoose.model('Judgment', judgmentSchema);

module.exports = Judgment;
