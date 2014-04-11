/** @jsx React.DOM */

'use strict';

void function() {

var dataUpdates = {
  'Clear Form': {
    textInput: ''
  , selectInput: ''
  }
, 'Valid Values': {
    textInput: '12345'
  , selectInput: '5'
  }
, 'Cross-Field Error Trigger': {
    textInput: '54321'
  , selectInput: '3'
  }
}

var ContrivedForm = forms.Form.extend({
  textInput: forms.CharField({minLength: 5, maxLength: 10, helpText: 'Must be between 5 and 10 characters long'})
, selectInput: forms.ChoiceField({choices: ['', 1,2,3,4,5]})
, crossFieldError: forms.BooleanField({required: false, label: 'Generate a cross-field error when selected value is 3'})

, clean: function() {
    if (this.cleanedData.crossFieldError && this.cleanedData.selectInput == '3') {
      throw forms.ValidationError('Cross-field error')
    }
  }
})

var ControlForm = forms.Form.extend({
  validate: forms.BooleanField({required: false, label: 'Validate (clears and re-applies validation)'})
, clearValidation: forms.BooleanField({required: false, label: 'Just clear validation'})
, dataUpdate: forms.ChoiceField({choices: Object.keys(dataUpdates)})
})

var Field = React.createClass({displayName: 'Field',
  render: function() {
    var bf = this.props.bf
    var fieldStyle = {marginBottom: '6px'}
    if (bf.field instanceof forms.BooleanField) {
      return React.DOM.div( {style:fieldStyle}, 
        React.DOM.label(null, bf.asWidget(), " ", bf.label), " ", bf.errors().messages()[0]
      )
    }
    else {
      return React.DOM.div( {style:fieldStyle}, 
        bf.labelTag(), " ", bf.asWidget(), " ", bf.errors().messages()[0], " ", this.props.children,
        bf.helpText && React.DOM.p(null, bf.helpText)
      )
    }
  }
})

var Component = React.createClass({displayName: 'Component',
  getInitialState: function() {
    return {
      form: new ContrivedForm({
        controlled: true
      , prefix: 'test'
      , validation: 'auto'
      , onStateChange: this.forceUpdate.bind(this)
      })
    , controlForm: new ControlForm({
        controlled: true
      , prefix: 'control'
      , onStateChange: this.forceUpdate.bind(this)
      })
    }
  }
, onSubmit: function(e) {
    e.preventDefault()
    this.state.form.validate(this.refs.form)
  }
, onUpdateData: function() {
    var form = this.state.controlForm
    if (form.validate(this.refs.form)) {
      var data = dataUpdates[form.cleanedData.dataUpdate]
      this.state.form.updateData(data, {
        validate: form.cleanedData.validate
      , clearValidation: form.cleanedData.clearValidation
      })
    }
  }
, render: function() {
    var fields = this.state.form.boundFieldsObj()
    var controlFields = this.state.controlForm.boundFieldsObj()
    return React.DOM.form( {ref:"form", onSubmit:this.onSubmit}, 
      React.DOM.fieldset(null, 
        React.DOM.legend(null, "Controlled Form Inputs"),
        React.DOM.p(null, "These inputs reflect the state of their ", React.DOM.code(null, "form.data")),
        React.DOM.div( {style:{display: 'inline-block'}}, 
          this.state.form.nonFieldErrors().render(),
          Field( {bf:fields.textInput}),
          Field( {bf:fields.selectInput}),
          Field( {bf:fields.crossFieldError}),
          React.DOM.button( {type:"submit"}, "Submit")
        ),
        React.DOM.div( {style:{display: 'inline-block', verticalAlign: 'top', marginLeft: '1em'}}, 
          React.DOM.pre(null, "form.data: ", JSON.stringify(this.state.form.data, null, 2)),
          React.DOM.pre(null, "form.cleanedData: ", this.state.form.cleanedData && JSON.stringify(this.state.form.cleanedData, null, 2))
        )
      ),
      React.DOM.fieldset(null, 
        React.DOM.p(null, "Make changes to the controlled ", React.DOM.code(null, "form.data"),":"),
        Field( {bf:controlFields.validate}),
        "...or...",
        Field( {bf:controlFields.clearValidation}),
        React.DOM.div( {style:{display: 'inline-block'}}, 
          Field( {bf:controlFields.dataUpdate})
        ),
        React.DOM.div( {style:{display: 'inline-block', verticalAlign: 'top', marginLeft: '1em'}}, 
          React.DOM.pre(null, 
            this.state.controlForm.data['control-dataUpdate'] &&
            JSON.stringify(dataUpdates[this.state.controlForm.data['control-dataUpdate']], null, 2)
          )
        ),
        React.DOM.div(null, 
          React.DOM.button( {type:"button", onClick:this.onUpdateData}, "form.updateData()")
        )
      )
    )
  }
})

React.renderComponent(Component(null), document.getElementById('app'))

}()
