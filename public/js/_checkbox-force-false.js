//* To force HTML to send "false" when a checkbox isn't checked
document.querySelectorAll('.checkbox-force-false').forEach(function(checkbox) {
  checkbox.addEventListener('change', function() {
    const hiddenInput = this.previousElementSibling;
    if (hiddenInput && hiddenInput.type === 'hidden') {
      hiddenInput.value = this.checked ? 'true' : 'false';
    }
  });
});
