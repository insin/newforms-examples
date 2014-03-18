/** @jsx React.DOM */

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
      return <label className="radio-inline">
        {input.tag()} {input.choiceLabel}
      </label>
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
    return <div key={bf.htmlName} className={$c('form-group', {'has-error': hasErrors})}>
      {bf.labelTag({attrs: {className: "col-sm-4 control-label"}})}
      <div className="col-sm-4">
        {bf.render({attrs: {className: fieldCassName}})}
      </div>
      <div className="col-sm-4 help-text">
        <p className="form-control-static">
          {hasErrors && errors.messages()[0]}
        </p>
      </div>
    </div>
  }
})

var Example = React.createClass({
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
      submitted = <div className="alert alert-success">
        <p>ContactForm data:</p>
        <pre><code>{JSON.stringify(this.state.submitted, null, '  ')}</code></pre>
      </div>
    }

    return <div>
      <div className="panel panel-default">
        <div className="panel-heading clearfix">
          <h3 className="panel-title pull-left">Contact Form</h3>
          <div className="pull-right">
            <label className="checkbox-inline">
              <input type="checkbox"
                checked={this.state.email}
                onChange={this.handleChange.bind(this, 'email')}
              /> Email
            </label>
            <label className="checkbox-inline">
              <input type="checkbox"
                checked={this.state.question}
                onChange={this.handleChange.bind(this, 'question')}
              /> Question
            </label>
          </div>
        </div>
        <ContactFormComponent ref="contactForm"
          email={this.state.email}
          question={this.state.question}
          company={this.props.company}
          onSubmit={this.handleSubmit}
        />
      </div>
      {submitted}
    </div>
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
var ContactFormComponent = React.createClass({
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
      validation: {event: 'onChange', delay: 500}
    , onStateChange: this.onFormStateChange
    , company: props.company
    , email: props.email
    , question: props.question
    }, extraKwargs)
  }

, onFormStateChange: function() {
    this.setState({form: this.state.form})
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
    var form = this.state.form
    var data = forms.formData(this.refs.form.getDOMNode())
    var isValid = form.setData(data)
    this.setState({form: form})
    this.props.onSubmit(isValid ? form.cleanedData : null)
  }

, render: function() {
    return <form ref="form" onSubmit={this.onSubmit}>
      <div className="panel-body">
        <div className="form-horizontal">
          {this.state.form.render()}
        </div>
      </div>
      <div className="panel-footer">
        <input type="submit" value="Submit" className="btn btn-primary btn-block"/>
      </div>
    </form>
  }
})

React.renderComponent(<Example company="FakeCo"/>, document.getElementById('app'))

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
