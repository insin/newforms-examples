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

, clean: requirePersonName
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

, clean: requirePersonName
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
  address  : forms.CharField({required: false, widget: forms.Textarea({attrs: {rows: 3}})})
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
  formset.extra++
  this.forceUpdate()
}

function field(bf, cssClass, options) {
  options = extend({label: true}, options)
  var errors = bf.errors().messages().map(function(message) {
    return React.DOM.div( {className:"help-block"}, message)
  })
  var errorClass = errors.length > 0 ? ' has-error' : ''
  return React.DOM.div( {key:bf.htmlName, className:cssClass + errorClass}, 
    React.DOM.div( {className:"form-group"}, 
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
      phoneNumberForms: new PhoneNumberFormSet({prefix: this.prefix('phone')})
    , emailAddressForms: new EmailAddressFormSet({prefix: this.prefix('email')})
    , addressForms: new AddressFormSet({prefix: this.prefix('address')})
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
    var data = forms.formData(this.refs.form.getDOMNode())
    var areContactDetailsValid = all([this.state.phoneNumberForms.setData(data),
                                      this.state.emailAddressForms.setData(data),
                                      this.state.addressForms.setData(data)])
    this.props.onSubmit(data, areContactDetailsValid)
  }

, render: function() {
    return React.DOM.form( {ref:"form", onSubmit:this.onSubmit}, 
      React.DOM.h2(null, "Add ", this.props.type),
      this.props.children,
      React.DOM.fieldset(null, 
        React.DOM.legend(null, "Contact details"),
        this.renderPhoneNumberForms(),
        React.DOM.p(null, React.DOM.a( {href:"#another", onClick:partial(this.addAnother, this.state.phoneNumberForms)}, "+ add another phone number")),

        this.renderEmailAddressForms(),
        React.DOM.p(null, React.DOM.a( {href:"#another", onClick:partial(this.addAnother, this.state.emailAddressForms)}, "+ add another email address")),

        this.renderAddressForms(),
        React.DOM.p(null, React.DOM.a( {href:"#another", onClick:partial(this.addAnother, this.state.addressForms)}, "+ add another address"))
      ),
      React.DOM.div( {className:"row"}, 
        React.DOM.div( {className:"col-sm-6"}, 
          React.DOM.div( {className:"form-group"}, 
            React.DOM.input( {type:"submit", className:"btn btn-primary", value:"Submit"})
          )
        )
      )
    )
  }

, renderPhoneNumberForms: function() {
    return this.state.phoneNumberForms.forms().map(function(form, i) {
      var renderFunc = (i === 0 ? field : widget)
      var bfo = form.boundFieldsObj()
      return React.DOM.div( {className:"row"}, 
        renderFunc(bfo.number, 'col-sm-5'),
        renderFunc(bfo.type, 'col-sm-2')
      )
    })
  }

, renderEmailAddressForms: function() {
    return this.state.emailAddressForms.forms().map(function(form, i) {
      var renderFunc = (i === 0 ? field : widget)
      var bfo = form.boundFieldsObj()
      return React.DOM.div( {className:"row"}, 
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
      return React.DOM.div(null, 
        multiple && React.DOM.h4(null, "Address ", i+1),
        React.DOM.div( {className:"row"}, 
          field(bfo.address, 'col-sm-5'),
          field(bfo.type, 'col-sm-2')
        ),
        React.DOM.div( {className:"row"}, 
          field(bfo.city, 'col-sm-3'),
          field(bfo.county, 'col-sm-2'),
          field(bfo.postCode, 'col-sm-2')
        ),
        React.DOM.div( {className:"row"}, 
          field(bfo.country, 'col-sm-7')
        )
      )
    })
  }
})

var AddPerson = React.createClass({displayName: 'AddPerson',
  getInitialState: function() {
    return {
      form: new PersonForm({prefix: 'person'})
    , cleanedData: false
    }
  }

, onSubmit: function(data, areContactDetailsValid) {
    var isPersonFormValid = this.state.form.setData(data)
    var cleanedData = false
    if (isPersonFormValid && areContactDetailsValid) {
      cleanedData = extend({
        person: this.state.form.cleanedData
      }, this.refs.contactDetails.getCleanedData())
    }
    console.info(cleanedData)
    this.setState({cleanedData: cleanedData})
  }

, render: function() {
    var cleanedData
    if (this.state.cleanedData !== false) {
      cleanedData = React.DOM.div(null, 
        React.DOM.h2(null, "cleanedData"),
        React.DOM.pre(null, JSON.stringify(this.state.cleanedData, null, ' '))
      )
    }
    return this.transferPropsTo(
      AddContact( {ref:"contactDetails",
                  type:"Person",
                  prefix:"person",
                  onSubmit:this.onSubmit}, 
        cleanedData,
        React.DOM.fieldset(null, 
          React.DOM.legend(null, "Personal details"),
          this.renderPersonForm()
        )
      )
    )
  }

, renderPersonForm: function() {
    var topErrors = this.state.form.nonFieldErrors().messages().map(function(message) {
      return React.DOM.p( {className:"alert alert-danger"}, message)
    })
    var bfo = this.state.form.boundFieldsObj()
    return React.DOM.div(null, 
      topErrors,
      React.DOM.div( {className:"row"}, 
        field(bfo.title, 'col-sm-2'),
        field(bfo.firstName, 'col-sm-3'),
        field(bfo.lastName, 'col-sm-3')
      ),
      React.DOM.div( {className:"row"}, 
        field(bfo.jobTitle, 'col-sm-4'),
        field(bfo.organisation, 'col-sm-4')
      )
    )
  }
})

var AddOrganisation = React.createClass({displayName: 'AddOrganisation',
  getInitialState: function() {
    return {
      form: new OrganisationForm({prefix: 'org'})
    , peopleForms: new InlinePersonFormSet({prefix: 'org'})
    , cleanedData: false
    }
  }

, addAnother: addAnother

, onSubmit: function(data, areContactDetailsValid) {
    var isOrgFormValid = this.state.form.setData(data)
    var arePeopleFormsValid = this.state.peopleForms.setData(data)
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
      cleanedData = React.DOM.div(null, 
        React.DOM.h2(null, "cleanedData"),
        React.DOM.pre(null, JSON.stringify(this.state.cleanedData, null, ' '))
      )
    }
    return this.transferPropsTo(
      AddContact( {ref:"contactDetails",
                  type:"Organisation",
                  prefix:"org",
                  onSubmit:this.onSubmit}, 
        cleanedData,
        React.DOM.fieldset(null, 
          React.DOM.legend(null, "Organisation"),
          this.renderOrganisatonForm()
        ),
        React.DOM.fieldset(null, 
          React.DOM.legend(null, "People"),
          React.DOM.table( {className:"table table-condensed"}, 
            React.DOM.thead(null, 
              React.DOM.tr(null, 
                React.DOM.th(null, "First Name"),
                React.DOM.th(null, "Last Name"),
                React.DOM.th(null, "Job Title"),
                React.DOM.th(null, "Email"),
                React.DOM.th(null, "Mobile Phone"),
                React.DOM.th(null, "Direct Phone")
              )
            ),
            React.DOM.tbody(null, 
              this.renderPeopleForms()
            )
          ),
          React.DOM.p(null, React.DOM.a( {href:"#another", onClick:partial(this.addAnother, this.state.peopleForms)}, "+ add another person"))
        )
      )
    )
  }

, renderOrganisatonForm: function() {
   var topErrors = this.state.form.nonFieldErrors().messages().map(function(message) {
      return React.DOM.div( {className:"alert alert-error"}, message)
    })
    var bfo = this.state.form.boundFieldsObj()
    return React.DOM.div(null, 
      topErrors,
      React.DOM.div( {className:"row"}, 
        field(bfo.name, 'col-sm-4')
      )
    )
  }

, renderPeopleForms: function() {
    return this.state.peopleForms.forms().map(function(form) {
      var cells = form.boundFields().map(function(bf) {
        return React.DOM.td( {key:bf.htmlName}, 
          bf.asWidget({attrs: {className: 'form-control'}})
        )
      })
      return React.DOM.tr( {key:form.prefix}, cells)
    }.bind(this))
  }
})

var App = React.createClass({displayName: 'App',
  render: function() {
    return React.DOM.div( {className:"container"}, 
      AddPerson(null),
      React.DOM.hr(null),
      AddOrganisation(null)
    )
  }
})

React.renderComponent(App(null), document.getElementById('app'))

}()
