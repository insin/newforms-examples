'use strict';

void function() {

var extend = isomorph.object.extend

var STATES = [
  'AL', 'AK', 'AS', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI',
  'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS',
  'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR',
  'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
]

var BootstrapRadioInlineRenderer = forms.RadioFieldRenderer.extend({
  render: function() {
    return this.choiceInputs().map(function(input) {
      return React.createElement("label", {className: "radio-inline"}, 
        input.tag(), " ", input.choiceLabel
      )
    })
  }
})

var ContactForm = forms.Form.extend({
  firstName: forms.CharField({maxLength: 50})
, lastName: forms.CharField({maxLength: 50})
, phoneNumber: forms.RegexField(/^[-\d]*$/, {
    errorMessages: {invalid: 'Invalid characters in phone number'}
  })
, email: forms.EmailField()
, question: forms.CharField({widget: forms.Textarea({attrs: {rows: 3}})})
, address: forms.CharField({widget: forms.Textarea({attrs: {rows: 3}})})
, city: forms.CharField({maxLength: 50})
, state: forms.ChoiceField({choices: STATES})
, zipCode: forms.RegexField(/^\d{5}(?:-?\d{4})?$/, {
    errorMessages: {invalid: 'Must be 5 digts or 5+4 digits'}
  })
, currentCustomer: forms.ChoiceField({
    choices: [['Y', 'Yes'], ['N', 'No']]
  , initial: 'N'
  , widget: forms.RadioSelect({renderer: BootstrapRadioInlineRenderer})
  })

, constructor: function(kwargs) {
    kwargs = extend({email: false, question: false}, kwargs)
    ContactForm.__super__.constructor.call(this, kwargs)
    this.fields.currentCustomer.label = 'Are you currently a ' + kwargs.company + ' Customer?'
    if (!kwargs.email) {
      delete this.fields.email
    }
    if (!kwargs.question) {
      delete this.fields.question
    }
  }

, cleanPhoneNumber: function() {
    var phoneNumber =  this.cleanedData.phoneNumber.replace(/-/g, '')
    if (phoneNumber.length < 10) {
      throw forms.ValidationError('Must contain at least 10 digits')
    }
    return phoneNumber
  }

, render: function() {
    return this.visibleFields().map(this.renderField.bind(this))
  }

, renderField: function(bf) {
    var errors = bf.errors()
    var hasErrors = errors.isPopulated()
    var fieldCassName = $c({'form-control': bf.name !== 'currentCustomer'})
    return React.createElement("div", {key: bf.htmlName, className: $c('form-group', {'has-error': hasErrors})}, 
      bf.labelTag({attrs: {className: "col-sm-4 control-label"}}), 
      React.createElement("div", {className: "col-sm-4"}, 
        bf.render({attrs: {className: fieldCassName}})
      ), 
      React.createElement("div", {className: "col-sm-4 help-text"}, 
        React.createElement("p", {className: "form-control-static"}, 
          hasErrors && errors.messages()[0]
        )
      )
    )
  }
})

var Example = React.createClass({displayName: 'Example',
  getInitialState: function() {
    return {
      email: true
    , question: true
    , submitted: null
    }
  }

, render: function() {
    var submitted
    if (this.state.submitted !== null) {
      submitted = React.createElement("div", {className: "alert alert-success"}, 
        React.createElement("p", null, "ContactForm data:"), 
        React.createElement("pre", null, React.createElement("code", null, JSON.stringify(this.state.submitted, null, '  ')))
      )
    }

    return React.createElement("div", null, 
      React.createElement("div", {className: "panel panel-default"}, 
        React.createElement("div", {className: "panel-heading clearfix"}, 
          React.createElement("h3", {className: "panel-title pull-left"}, "Contact Form"), 
          React.createElement("div", {className: "pull-right"}, 
            React.createElement("label", {className: "checkbox-inline"}, 
              React.createElement("input", {type: "checkbox", 
                checked: this.state.email, 
                onChange: this.handleChange.bind(this, 'email')}
              ), " Email"
            ), 
            React.createElement("label", {className: "checkbox-inline"}, 
              React.createElement("input", {type: "checkbox", 
                checked: this.state.question, 
                onChange: this.handleChange.bind(this, 'question')}
              ), " Question"
            )
          )
        ), 
        React.createElement(ContactFormComponent, {ref: "contactForm", 
          email: this.state.email, 
          question: this.state.question, 
          company: this.props.company, 
          onSubmit: this.handleSubmit}
        )
      ), 
      submitted
    )
  }

, handleChange: function(field, e) {
    var nextState = {}
    nextState[field] = e.target.checked
    this.setState(nextState)
  }

, handleSubmit: function(data) {
    this.setState({submitted: data})
  }
})

/**
 * A contact form with certain optional fields.
 */
var ContactFormComponent = React.createClass({displayName: 'ContactFormComponent',
  getDefaultProps: function() {
    return {
      email: true
    , question: false
    }
  }

, getInitialState: function() {
    return {
      form: new ContactForm(this.getFormKwargs(this.props))
    }
  }

, getFormKwargs: function(props, extraKwargs) {
    return extend({
      validation: {on: 'change blur', delay: 500}
    , onChange: this.forceUpdate.bind(this)
    , company: props.company
    , email: props.email
    , question: props.question
    }, extraKwargs)
  }

, componentWillReceiveProps: function(nextProps) {
    if (nextProps.email !== this.props.email ||
        nextProps.question !== this.props.question) {
      var formKwargs = this.getFormKwargs(nextProps, {
        data: (this.state.form.isBound ? this.state.form.data : null)
      })
      var form = new ContactForm(formKwargs)
      // Carry over any errors present, as they're needed for display. We don't
      // want to force the entire form to re-validate as we may be showing a new
      // field and marking it as invalid before the user has had a chance to
      // enter data.
      form._errors = this.state.form._errors
      this.setState({form: form})
    }
  }

, onSubmit: function(e) {
    e.preventDefault()
    var isValid = this.state.form.validate()
    this.props.onSubmit(isValid ? this.state.form.cleanedData : null)
    this.forceUpdate()
  }

, render: function() {
    return React.createElement("form", {ref: "form", onSubmit: this.onSubmit}, 
      React.createElement("div", {className: "panel-body"}, 
        React.createElement("div", {className: "form-horizontal"}, 
          this.state.form.render()
        )
      ), 
      React.createElement("div", {className: "panel-footer"}, 
        React.createElement("button", {type: "submit", className: "btn btn-primary btn-block"}, "Submit")
      )
    )
  }
})

React.render(React.createElement(Example, {company: "FakeCo"}), document.getElementById('app'))

// Utils

function $c(staticClassName, conditionalClassNames) {
  var classNames = []
  if (typeof conditionalClassNames == 'undefined') {
    conditionalClassNames = staticClassName
  }
  else {
    classNames.push(staticClassName)
  }
  for (var className in conditionalClassNames) {
    if (!!conditionalClassNames[className]) {
      classNames.push(className)
    }
  }
  return classNames.join(' ')
}

}()
