// Enhanced Form Validation with Better UX
export const Validation = {
  // Validation rules
  rules: {
    required: (value) => value.trim() !== "",
    email: (value) => window.CONFIG.VALIDATION.EMAIL_REGEX.test(value),
    phone: (value) => !value || window.CONFIG.VALIDATION.PHONE_REGEX.test(value),
    minLength: (value, min) => value.length >= min,
    maxLength: (value, max) => value.length <= max,
    match: (value, matchValue) => value === matchValue,
    pattern: (value, pattern) => new RegExp(pattern).test(value),
    number: (value) => !isNaN(value) && !isNaN(Number.parseFloat(value)),
    min: (value, min) => Number.parseFloat(value) >= min,
    max: (value, max) => Number.parseFloat(value) <= max,
  },

  // Error messages
  messages: {
    required: "Este campo es obligatorio",
    email: "Introduce un email válido",
    phone: "Introduce un teléfono válido",
    minLength: (min) => `Debe tener al menos ${min} caracteres`,
    maxLength: (max) => `No puede tener más de ${max} caracteres`,
    match: "Las contraseñas no coinciden",
    pattern: "El formato no es válido",
    number: "Debe ser un número válido",
    min: (min) => `El valor mínimo es ${min}`,
    max: (max) => `El valor máximo es ${max}`,
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

      if (rule.type === "maxLength" && !this.rules.maxLength(value, rule.value)) {
        errors.push(this.messages.maxLength(rule.value))
      }

      if (rule.type === "match") {
        const matchField = window.Utils.$(rule.field)
        if (matchField && !this.rules.match(value, matchField.value)) {
          errors.push(this.messages.match)
        }
      }

      if (rule.type === "pattern" && !this.rules.pattern(value, rule.value)) {
        errors.push(this.messages.pattern)
      }

      if (rule.type === "number" && value && !this.rules.number(value)) {
        errors.push(this.messages.number)
      }

      if (rule.type === "min" && value && !this.rules.min(value, rule.value)) {
        errors.push(this.messages.min(rule.value))
      }

      if (rule.type === "max" && value && !this.rules.max(value, rule.value)) {
        errors.push(this.messages.max(rule.value))
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

  // Initialize method
  init() {
    console.log("✅ Validation module initialized")
    return this
  },
}

// Auto-initialize
Validation.init()

// Make available globally for backward compatibility
if (typeof window !== "undefined") {
  window.Validation = Validation
}
