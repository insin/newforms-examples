newforms-examples
=================

### [All Default Fields](http://insin.github.io/newforms-examples/all-fields/) ([source](https://github.com/insin/newforms-examples/tree/master/all-fields))

A basic form with as many of the default newforms fields and widgets as possible, showing a range of the options supported by the fields.

This example also demonstrates:
* overriding the default `render()` method
* implementing custom rendering using `BoundField`s and JSX.

### [Custom Form Layout](http://insin.github.io/newforms-examples/custom-layout/) ([source](https://github.com/insin/newforms-examples/tree/master/custom-layout))

This example shows how you could write a custom, reusable layout for laying out form fields in grids based on a specification like this:

```javascript
GridLayout({
  layout: [
    [ 'name'      ]
  , [ 'theme'     ]
  , [ 'startDate' , 'releaseDate' ]
  , [ 'state'     , 'resources'   ]
  , [ 'project'   ]
  , [ 'estimate'  ]
  , [ 'notes'     ]
  ]
, fillerCssClass: 'empty'
, topErrorCssClass: 'top-errors'
})
```

This is backed up with a base `FormLayout` object and a new base `LayoutForm` which uses it - these could serve as the basis for any kind of reusable custom layout you like with `BoundField`s and JSX.

It also has examples of:
* using a form's constructor to implement dynamic choices.
* full-form cleaning by implementing a `clean()` method.
* a standard pattern for using a newforms `Forn` within a React component, holding the form as state.

### [Bootstrap Dynamic Contact Form](http://insin.github.io/newforms-examples/contact-form/) ([source](https://github.com/insin/newforms-examples/tree/master/contact-form))

An example of implementing a custom layout using Bootstrap and using some React state to dynamically control which fields are displayed.

It also has examples of:
* extending a `RadioFieldRenderer` to customise its output.
* implementing a `clean<FieldName>()` function for per-field validation logic.

### ["Add Another" with FormSets](http://insin.github.io/newforms-examples/formset-add-another/) ([source](https://github.com/insin/newforms-examples/tree/master/formset-add-another))

An example of implementing (multiple) forms with "Add Another" functionality simply by incrementing a `FormSet`'s `extra` property.

This example also shows:
* using `prefix` to have multiple instances of the same FormSet on a page without id/name conflicts.
* validating and getting cleanedData out of multiple FormSets.
* reusing a component for common contact fields.
* implementing a Bootstrap 3 form layout using a `form.boundFieldsObj()` and a custom field rendering function.
