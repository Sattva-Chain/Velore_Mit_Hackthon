function adaptInstructionByConfidence(instructionText, confidence) {
  const normalized = String(confidence || '').toLowerCase();

  if (normalized === 'high') {
    return instructionText;
  }

  if (normalized === 'medium') {
    return instructionText.replace('Walk', 'Continue slowly and').replace('Turn', 'Please prepare to turn');
  }

  return 'I am less confident about your exact position. Please continue slowly and scan a nearby QR marker if available.';
}

module.exports = { adaptInstructionByConfidence };
