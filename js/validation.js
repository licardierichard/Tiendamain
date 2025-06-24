// Form Validation
const Validation = {
  // Validation rules
  rules: {
    required: (value) => value.trim() !== "",
    email: (value) => Utils.isValidEmail(value),
    phone: (value) => !value || Utils.isValidPhone(value),
    minLength: (value, min) => value.length >= min,
    match: (value, matchValue) => value === matchValue,
  },

  // Error messages
  messages: {
    required: "Este campo es obligatorio",
    email: "Introduce un email válido",
    phone: "Introduce un teléfono válido",
    minLength: (min) => `Debe tener al menos ${min} caracteres`,
    match: "Las contraseñas no coinciden",
  },

  // Validate single field
  validateField(field, rules) {
    const value = field.value
    const errors = []

    for (const rule of rules) {
      if (rule.type === "required" && !this.rules.required(value)) {
        errors.push(this.messages.required)
        break
      }

      if (value && rule.type === "email" && !this.rules.email(value)) {
        errors.push(this.messages.email)
      }

      if (value && rule.type === "phone" && !this.rules.phone(value)) {
        errors.push(this.messages.phone)
      }

      if (rule.type === "minLength" && !this.rules.minLength(value, rule.value)) {
        errors.push(this.messages.minLength(rule.value))
      }

      if (rule.type === "match") {
        const matchField = Utils.$(rule.field)
        if (matchField && !this.rules.match(value, matchField.value)) {
          errors.push(this.messages.match)
        }
      }
    }

    return errors
  },

  // Show field validation state
  showFieldValidation(field, errors) {
    const formGroup = field.closest(".form-group")
    const errorElement = formGroup.querySelector(".form-error")

    // Remove existing classes
    formGroup.classList.remove("error", "success")

    if (errors.length > 0) {
      formGroup.classList.add("error")
      if (errorElement) {
        errorElement.textContent = errors[0]
      }
      return false
    } else if (field.value.trim() !== "") {
      formGroup.classList.add("success")
      if (errorElement) {
        errorElement.textContent = ""
      }
    }

    return true
  },

  // Validate entire form
  validateForm(form, validationRules) {
    let isValid = true

    for (const fieldName in validationRules) {
      const field = form.querySelector(`[name="${fieldName}"]`)
      if (field) {
        const errors = this.validateField(field, validationRules[fieldName])
        const fieldValid = this.showFieldValidation(field, errors)
        if (!fieldValid) isValid = false
      }
    }

    return isValid
  },

  // Setup real-time validation
  setupValidation(form, validationRules) {
    for (const fieldName in validationRules) {
      const field = form.querySelector(`[name="${fieldName}"]`)
      if (field) {
        // Validate on blur
        field.addEventListener("blur", () => {
          const errors = this.validateField(field, validationRules[fieldName])
          this.showFieldValidation(field, errors)
        })

        // Clear errors on input
        field.addEventListener("input", () => {
          const formGroup = field.closest(".form-group")
          if (formGroup.classList.contains("error")) {
            formGroup.classList.remove("error")
            const errorElement = formGroup.querySelector(".form-error")
            if (errorElement) errorElement.textContent = ""
          }
        })
      }
    }
  },
}

// Make Validation globally available
window.Validation = Validation
