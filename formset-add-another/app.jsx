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
    return <div className="help-block">{message}</div>
  })
  var errorClass = errors.length > 0 ? ' has-error' : ''
  return <div key={bf.htmlName} className={cssClass + errorClass}>
    <div className="form-group">
      {options.label && bf.labelTag()}
      {bf.asWidget({attrs: {className: 'form-control'}})}
      {errors}
    </div>
  </div>
}

function widget(bf, cssClass) {
  return field(bf, cssClass, {label: false})
}

var AddContact = React.createClass({
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
    return <form ref="form" onSubmit={this.onSubmit}>
      <h2>Add {this.props.type}</h2>
      {this.props.children}
      <fieldset>
        <legend>Contact details</legend>
        {this.renderPhoneNumberForms()}
        <p><a href="#another" onClick={partial(this.addAnother, this.state.phoneNumberForms)}>+ add another phone number</a></p>

        {this.renderEmailAddressForms()}
        <p><a href="#another" onClick={partial(this.addAnother, this.state.emailAddressForms)}>+ add another email address</a></p>

        {this.renderAddressForms()}
        <p><a href="#another" onClick={partial(this.addAnother, this.state.addressForms)}>+ add another address</a></p>
      </fieldset>
      <div className="row">
        <div className="col-sm-6">
          <div className="form-group">
            <input type="submit" className="btn btn-primary" value="Submit"/>
          </div>
        </div>
      </div>
    </form>
  }

, renderPhoneNumberForms: function() {
    return this.state.phoneNumberForms.forms().map(function(form, i) {
      var renderFunc = (i === 0 ? field : widget)
      var bfo = form.boundFieldsObj()
      return <div className="row">
        {renderFunc(bfo.number, 'col-sm-5')}
        {renderFunc(bfo.type, 'col-sm-2')}
      </div>
    })
  }

, renderEmailAddressForms: function() {
    return this.state.emailAddressForms.forms().map(function(form, i) {
      var renderFunc = (i === 0 ? field : widget)
      var bfo = form.boundFieldsObj()
      return <div className="row">
        {renderFunc(bfo.email, 'col-sm-5')}
        {renderFunc(bfo.type, 'col-sm-2')}
      </div>
    })
  }

, renderAddressForms: function() {
    var forms = this.state.addressForms.forms()
    var multiple = forms.length > 1
    return this.state.addressForms.forms().map(function(form, i) {
      var bfo = form.boundFieldsObj()
      return <div>
        {multiple && <h4>Address {i+1}</h4>}
        <div className="row">
          {field(bfo.address, 'col-sm-5')}
          {field(bfo.type, 'col-sm-2')}
        </div>
        <div className="row">
          {field(bfo.city, 'col-sm-3')}
          {field(bfo.county, 'col-sm-2')}
          {field(bfo.postCode, 'col-sm-2')}
        </div>
        <div className="row">
          {field(bfo.country, 'col-sm-7')}
        </div>
      </div>
    })
  }
})

var AddPerson = React.createClass({
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
      cleanedData = <div>
        <h2>cleanedData</h2>
        <pre>{JSON.stringify(this.state.cleanedData, null, ' ')}</pre>
      </div>
    }
    return this.transferPropsTo(
      <AddContact ref="contactDetails"
                  type="Person"
                  prefix="person"
                  onSubmit={this.onSubmit}>
        {cleanedData}
        <fieldset>
          <legend>Personal details</legend>
          {this.renderPersonForm()}
        </fieldset>
      </AddContact>
    )
  }

, renderPersonForm: function() {
    var topErrors = this.state.form.nonFieldErrors().messages().map(function(message) {
      return <p className="alert alert-danger">{message}</p>
    })
    var bfo = this.state.form.boundFieldsObj()
    return <div>
      {topErrors}
      <div className="row">
        {field(bfo.title, 'col-sm-2')}
        {field(bfo.firstName, 'col-sm-3')}
        {field(bfo.lastName, 'col-sm-3')}
      </div>
      <div className="row">
        {field(bfo.jobTitle, 'col-sm-4')}
        {field(bfo.organisation, 'col-sm-4')}
      </div>
    </div>
  }
})

var AddOrganisation = React.createClass({
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
      cleanedData = <div>
        <h2>cleanedData</h2>
        <pre>{JSON.stringify(this.state.cleanedData, null, ' ')}</pre>
      </div>
    }
    return this.transferPropsTo(
      <AddContact ref="contactDetails"
                  type="Organisation"
                  prefix="org"
                  onSubmit={this.onSubmit}>
        {cleanedData}
        <fieldset>
          <legend>Organisation</legend>
          {this.renderOrganisatonForm()}
        </fieldset>
        <fieldset>
          <legend>People</legend>
          <table className="table table-condensed">
            <thead>
              <tr>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Job Title</th>
                <th>Email</th>
                <th>Mobile Phone</th>
                <th>Direct Phone</th>
              </tr>
            </thead>
            <tbody>
              {this.renderPeopleForms()}
            </tbody>
          </table>
          <p><a href="#another" onClick={partial(this.addAnother, this.state.peopleForms)}>+ add another person</a></p>
        </fieldset>
      </AddContact>
    )
  }

, renderOrganisatonForm: function() {
   var topErrors = this.state.form.nonFieldErrors().messages().map(function(message) {
      return <div className="alert alert-error">{message}</div>
    })
    var bfo = this.state.form.boundFieldsObj()
    return <div>
      {topErrors}
      <div className="row">
        {field(bfo.name, 'col-sm-4')}
      </div>
    </div>
  }

, renderPeopleForms: function() {
    return this.state.peopleForms.forms().map(function(form) {
      var cells = form.boundFields().map(function(bf) {
        return <td key={bf.htmlName}>
          {bf.asWidget({attrs: {className: 'form-control'}})}
        </td>
      })
      return <tr key={form.prefix}>{cells}</tr>
    }.bind(this))
  }
})

var App = React.createClass({
  render: function() {
    return <div className="container">
      <AddPerson/>
      <hr/>
      <AddOrganisation/>
    </div>
  }
})

React.renderComponent(<App/>, document.getElementById('app'))

}()
