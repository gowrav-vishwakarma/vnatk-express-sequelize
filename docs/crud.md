# `{base_path}/crud` 
---

## API Options

| Option      | Type        | Default | Description 
| ----------- | ----------- | --------| ----
| model       | `String`      | `null`  | Model name to work on, [Mendatory]
| read   | `JSON`        | {} | options for read operations, [Optional]
| read.modeloptions   | `JSON` |         | Options to pass to your model define above
| read.modelscope   | `String`\|`false` |       | `false` to use unscoped model and avoid any default scope applied on model, or use define scope to use as string
| read.autoderef   | `Boolean`       | `true` | Try to solve belongsTo relation and get name/title of related field ie cityId to City.name (Auto includes)
| read.headers   | `Boolean`       | `true` | Sends headers infor about fields included for UI processing, Mainly used by VNATK-VUE, you can set to `false` is only using APIs.
| actions   | `Boolean`       | `true` | Sends Actions applicable including Create, Update and Delete and their formschema, set to `false` if using in API only mode.



There are more rich set of options applicable when using with VNATK-VUE. To know more about those options pls follow [VUEATK-VUE ](https://github.com/gowrav-vishwakarma/vnatk-vue)

## API template

```javascript

let crudOptions = {
  model:'User',
  read:{
    modeloptions:{
      attributes:['name','age'],
      include:[
        {
          model:'City', 
          as:'MyCity',
          scope:false // <== or String to modify City model with unscoped or scope defined by this string
        }
      ],
      where:{
        age:{
          $lt: 18 // <== use operators as operator alias
        }
      }
    },
    modelscope:false // <== false for unscoped User or String for scope name for User model
  }
}

// Calling by axios
service.post('/vnatk/crud',crudOptions).then(response=>{
    // you get your data in response.data here 
})
```
