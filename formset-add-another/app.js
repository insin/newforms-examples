/** @jsx React.DOM */

'use strict';

void function() {

// ========================================================= Aliases & Utils ===

var extend = isomorph.object.extend

/**
 * When fn.bind(null, ...) gets fn dull, put some partial(fn, ...) in your,
 * er... skull?
 */
function partial(fn) {
  var args = Array.prototype.slice.call(arguments, 1)
  return function () {
    return fn.apply(this, args.concat(Array.prototype.slice.call(arguments)))
  }
}

/**
 * Returns true if all the items in a given list are truthy, false otherwise.
 */
function all(list) {
  for (var i = 0, l = list.length; i < l; i++) {
    if (!list[i]) {
      return false
    }
  }
  return true
}

// ================================================================= Choices ===

var EMPTY_CHOICE = ['', '']

var TITLE_CHOICES = [
  EMPTY_CHOICE
, ['Mr', 'Mr']
, ['Master', 'Master']
, ['Mrs', 'Mrs']
, ['Miss', 'Miss']
, ['Ms', 'Ms']
, ['Dr', 'Dr']
, ['Prof', 'Prof']
]

var PHONE_NUMBER_TYPE_CHOICES = [
  EMPTY_CHOICE
, ['Home', 'Home']
, ['Work', 'Work']
, ['Mobile', 'Mobile']
, ['Fax', 'Fax']
, ['Direct', 'Direct']
]

var EMAIL_TYPE_CHOICES = [
  EMPTY_CHOICE
, ['Home', 'Home']
, ['Work', 'Work']
]

var ADDRESS_TYPE_CHOICES = [
  EMPTY_CHOICE
, ['Home', 'Home']
, ['Postal', 'Postal']
, ['Office', 'Office']
]

var COUNTRY_CHOICES = [
  EMPTY_CHOICE
, ['XX', 'Testistan']
]

// =================================================================== Forms ===

/**
 * Clean function which validates that at least one part of a person's name has
 * been given.
 */
function requirePersonName() {
  /* jshint validthis: true */
  if (!this.cleanedData.firstName && !this.cleanedData.lastName) {
    throw forms.ValidationError('A first name or last name is required.')
  }
}

var PersonForm = forms.Form.extend({
  title        : forms.ChoiceField({required: false, choices: TITLE_CHOICES})
, firstName    : forms.CharField({required: false, maxLength: 50})
, lastName     : forms.CharField({required: false, maxLength: 50})
, jobTitle     : forms.CharField({required: false, maxLength: 100})
, organisation : forms.CharField({required: false})

, clean: ['firstName', 'lastName', requirePersonName]
})

var OrganisationForm = forms.Form.extend({
  name : forms.CharField({maxLength: 100})
})

var InlinePersonForm = forms.Form.extend({
  firstName    : forms.CharField({required: false, maxLength: 50})
, lastName     : forms.CharField({required: false, maxLength: 50})
, jobTitle     : forms.CharField({required: false, maxLength: 100})
, email        : forms.EmailField({required: false})
, mobilePhone  : forms.CharField({required: false})
, directPhone  : forms.CharField({required: false})

, clean: ['firstName', 'lastName', requirePersonName]
})

var PhoneNumberForm = forms.Form.extend({
  number : forms.CharField({maxLength: 30, label: 'Phone number'})
, type   : forms.ChoiceField({required: false, choices: PHONE_NUMBER_TYPE_CHOICES})
})

var EmailAddressForm = forms.Form.extend({
  email : forms.EmailField({label: 'Email address'})
, type  : forms.ChoiceField({required: false, choices: EMAIL_TYPE_CHOICES})
})

var AddressForm = forms.Form.extend({
  address  : forms.CharField({widget: forms.Textarea({attrs: {rows: 3}})})
, type     : forms.ChoiceField({required: false, choices: ADDRESS_TYPE_CHOICES})
, city     : forms.CharField({required: false, maxLength: 100, label: 'City/Town'})
, county   : forms.CharField({required: false, maxLength: 100})
, postCode : forms.CharField({required: false, maxLength: 8})
, country  : forms.ChoiceField({required: false, choices: COUNTRY_CHOICES})
})

var InlinePersonFormSet = forms.formsetFactory(InlinePersonForm)
var PhoneNumberFormSet  = forms.formsetFactory(PhoneNumberForm)
var EmailAddressFormSet = forms.formsetFactory(EmailAddressForm)
var AddressFormSet      = forms.formsetFactory(AddressForm)

// ======================================================== React Components ===

function addAnother(formset, e) {
  /* jshint validthis: true */
  e.preventDefault()
  formset.addAnother()
}

function field(bf, cssClass, options) {
  options = extend({label: true}, options)
  var errors = bf.errors().messages().map(function(message) {
    return React.createElement("div", {className: "help-block"}, message)
  })
  var errorClass = errors.length > 0 ? ' has-error' : ''
  return React.createElement("div", {key: bf.htmlName, className: cssClass + errorClass}, 
    React.createElement("div", {className: "form-group"}, 
      options.label && bf.labelTag(), 
      bf.asWidget({attrs: {className: 'form-control'}}), 
      errors
    )
  )
}

function widget(bf, cssClass) {
  return field(bf, cssClass, {label: false})
}

var AddContact = React.createClass({displayName: 'AddContact',
  getInitialState: function() {
    return {
      phoneNumberForms: new PhoneNumberFormSet({
        prefix: this.prefix('phone')
      , onChange: this.forceUpdate.bind(this)
      })
    , emailAddressForms: new EmailAddressFormSet({
        prefix: this.prefix('email')
      , onChange: this.forceUpdate.bind(this)
      })
    , addressForms: new AddressFormSet({
        prefix: this.prefix('address')
      , onChange: this.forceUpdate.bind(this)
      })
    }
  }

, prefix: function(formsetType) {
    return this.props.prefix + '-' + formsetType
  }

, addAnother: addAnother

, getCleanedData: function() {
    return {
      phoneNumbers: this.state.phoneNumberForms.cleanedData()
    , emailAddresses: this.state.emailAddressForms.cleanedData()
    , addresses: this.state.addressForms.cleanedData()
    }
  }

, onSubmit: function(e) {
    e.preventDefault()
    var areContactDetailsValid = all([this.state.phoneNumberForms.validate(),
                                      this.state.emailAddressForms.validate(),
                                      this.state.addressForms.validate()])
    this.props.onSubmit(areContactDetailsValid)
  }

, render: function() {
    return React.createElement("form", {ref: "form", onSubmit: this.onSubmit}, 
      React.createElement("h2", null, "Add ", this.props.type), 
      this.props.children, 
      React.createElement("fieldset", null, 
        React.createElement("legend", null, "Contact details"), 
        this.renderPhoneNumberForms(), 
        React.createElement("p", null, React.createElement("a", {href: "#another", onClick: partial(this.addAnother, this.state.phoneNumberForms)}, "+ add another phone number")), 

        this.renderEmailAddressForms(), 
        React.createElement("p", null, React.createElement("a", {href: "#another", onClick: partial(this.addAnother, this.state.emailAddressForms)}, "+ add another email address")), 

        this.renderAddressForms(), 
        React.createElement("p", null, React.createElement("a", {href: "#another", onClick: partial(this.addAnother, this.state.addressForms)}, "+ add another address"))
      ), 
      React.createElement("div", {className: "row"}, 
        React.createElement("div", {className: "col-sm-6"}, 
          React.createElement("div", {className: "form-group"}, 
            React.createElement("input", {type: "submit", className: "btn btn-primary", value: "Submit"})
          )
        )
      )
    )
  }

, renderPhoneNumberForms: function() {
    return this.state.phoneNumberForms.forms().map(function(form, i) {
      var renderFunc = (i === 0 ? field : widget)
      var bfo = form.boundFieldsObj()
      return React.createElement("div", {className: "row"}, 
        renderFunc(bfo.number, 'col-sm-5'), 
        renderFunc(bfo.type, 'col-sm-2')
      )
    })
  }

, renderEmailAddressForms: function() {
    return this.state.emailAddressForms.forms().map(function(form, i) {
      var renderFunc = (i === 0 ? field : widget)
      var bfo = form.boundFieldsObj()
      return React.createElement("div", {className: "row"}, 
        renderFunc(bfo.email, 'col-sm-5'), 
        renderFunc(bfo.type, 'col-sm-2')
      )
    })
  }

, renderAddressForms: function() {
    var forms = this.state.addressForms.forms()
    var multiple = forms.length > 1
    return this.state.addressForms.forms().map(function(form, i) {
      var bfo = form.boundFieldsObj()
      return React.createElement("div", null, 
        multiple && React.createElement("h4", null, "Address ", i+1), 
        React.createElement("div", {className: "row"}, 
          field(bfo.address, 'col-sm-5'), 
          field(bfo.type, 'col-sm-2')
        ), 
        React.createElement("div", {className: "row"}, 
          field(bfo.city, 'col-sm-3'), 
          field(bfo.county, 'col-sm-2'), 
          field(bfo.postCode, 'col-sm-2')
        ), 
        React.createElement("div", {className: "row"}, 
          field(bfo.country, 'col-sm-7')
        )
      )
    })
  }
})

var AddPerson = React.createClass({displayName: 'AddPerson',
  getInitialState: function() {
    return {
      form: new PersonForm({
        prefix: 'person'
      , onChange: this.forceUpdate.bind(this)
      })
    , cleanedData: false
    }
  }

, onSubmit: function(areContactDetailsValid) {
    var isPersonFormValid = this.state.form.validate()
    var cleanedData = false
    if (isPersonFormValid && areContactDetailsValid) {
      cleanedData = extend({
        person: this.state.form.cleanedData
      }, this.refs.contactDetails.getCleanedData())
    }
    this.setState({cleanedData: cleanedData})
  }

, render: function() {
    var cleanedData
    if (this.state.cleanedData !== false) {
      cleanedData = React.createElement("div", null, 
        React.createElement("h2", null, "cleanedData"), 
        React.createElement("pre", null, JSON.stringify(this.state.cleanedData, null, ' '))
      )
    }
    return this.transferPropsTo(
      React.createElement(AddContact, {ref: "contactDetails", 
                  type: "Person", 
                  prefix: "person", 
                  onSubmit: this.onSubmit}, 
        cleanedData, 
        React.createElement("fieldset", null, 
          React.createElement("legend", null, "Personal details"), 
          this.renderPersonForm()
        )
      )
    )
  }

, renderPersonForm: function() {
    var topErrors = this.state.form.nonFieldErrors().messages().map(function(message) {
      return React.createElement("p", {className: "alert alert-danger"}, message)
    })
    var bfo = this.state.form.boundFieldsObj()
    return React.createElement("div", null, 
      topErrors, 
      React.createElement("div", {className: "row"}, 
        field(bfo.title, 'col-sm-2'), 
        field(bfo.firstName, 'col-sm-3'), 
        field(bfo.lastName, 'col-sm-3')
      ), 
      React.createElement("div", {className: "row"}, 
        field(bfo.jobTitle, 'col-sm-4'), 
        field(bfo.organisation, 'col-sm-4')
      )
    )
  }
})

var AddOrganisation = React.createClass({displayName: 'AddOrganisation',
  getInitialState: function() {
    return {
      form: new OrganisationForm({
        prefix: 'org'
      , onChange: this.forceUpdate.bind(this)
      })
    , peopleForms: new InlinePersonFormSet({
        prefix: 'org'
      , onChange: this.forceUpdate.bind(this)
      })
    , cleanedData: false
    }
  }

, addAnother: addAnother

, onSubmit: function(areContactDetailsValid) {
    var isOrgFormValid = this.state.form.validate()
    var arePeopleFormsValid = this.state.peopleForms.validate()
    var cleanedData = false
    if (isOrgFormValid && arePeopleFormsValid && areContactDetailsValid) {
      cleanedData = extend({
        organisation: this.state.form.cleanedData
      , people: this.state.peopleForms.cleanedData()
      }, this.refs.contactDetails.getCleanedData())
    }
    this.setState({cleanedData: cleanedData})
  }

, render: function() {
    var cleanedData
    if (this.state.cleanedData !== false) {
      cleanedData = React.createElement("div", null, 
        React.createElement("h2", null, "cleanedData"), 
        React.createElement("pre", null, JSON.stringify(this.state.cleanedData, null, ' '))
      )
    }
    return this.transferPropsTo(
      React.createElement(AddContact, {ref: "contactDetails", 
                  type: "Organisation", 
                  prefix: "org", 
                  onSubmit: this.onSubmit}, 
        cleanedData, 
        React.createElement("fieldset", null, 
          React.createElement("legend", null, "Organisation"), 
          this.renderOrganisatonForm()
        ), 
        React.createElement("fieldset", null, 
          React.createElement("legend", null, "People"), 
          React.createElement("table", {className: "table table-condensed"}, 
            React.createElement("thead", null, 
              React.createElement("tr", null, 
                React.createElement("th", null, "First Name"), 
                React.createElement("th", null, "Last Name"), 
                React.createElement("th", null, "Job Title"), 
                React.createElement("th", null, "Email"), 
                React.createElement("th", null, "Mobile Phone"), 
                React.createElement("th", null, "Direct Phone")
              )
            ), 
            React.createElement("tbody", null, 
              this.renderPeopleForms()
            )
          ), 
          React.createElement("p", null, React.createElement("a", {href: "#another", onClick: partial(this.addAnother, this.state.peopleForms)}, "+ add another person"))
        )
      )
    )
  }

, renderOrganisatonForm: function() {
   var topErrors = this.state.form.nonFieldErrors().messages().map(function(message) {
      return React.createElement("div", {className: "alert alert-error"}, message)
    })
    var bfo = this.state.form.boundFieldsObj()
    return React.createElement("div", null, 
      topErrors, 
      React.createElement("div", {className: "row"}, 
        field(bfo.name, 'col-sm-4')
      )
    )
  }

, renderPeopleForms: function() {
    return this.state.peopleForms.forms().map(function(form) {
      var cells = form.boundFields().map(function(bf) {
        var errors = bf.errors().messages().map(function(message) {
          return React.createElement("div", {className: "help-block"}, message)
        })
        var errorClass = errors.length > 0 ? 'has-error' : ''
        return React.createElement("td", {className: errorClass, key: bf.htmlName}, 
          bf.asWidget({attrs: {className: 'form-control'}}), 
          errors
        )
      })
      var nonFieldErrors = form.nonFieldErrors().messages().map(function(message) {
        return React.createElement("div", {className: "help-block"}, message)
      })
      var nonFieldErrorClass = nonFieldErrors.length > 0 ? 'has-non-field-error' : ''
      var rows = [React.createElement("tr", {key: form.prefix, className: nonFieldErrorClass}, cells)]
      if (nonFieldErrors.length > 0) {
        rows.unshift(React.createElement("tr", {key: form.prefix + '-nonFieldErrors', className: "error-row"}, 
          React.createElement("td", {colSpan: "6", className: "has-error"}, nonFieldErrors)
        ))
      }
      return rows
    }.bind(this))
  }
})

var App = React.createClass({displayName: 'App',
  render: function() {
    return React.createElement("div", {className: "container"}, 
      React.createElement(AddPerson, null), 
      React.createElement("hr", null), 
      React.createElement(AddOrganisation, null)
    )
  }
})

React.render(React.createElement(App, null), document.getElementById('app'))

}()
