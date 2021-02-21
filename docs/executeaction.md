# `{base_path}/executeaction` 
---

## API Options

| Option      | Type        | Default | Description 
| ----------- | ----------- | --------| ----
| model       | `String`      | `null`  | Model name to work on, [Mendatory]
| read   | `JSON`        | {} | options for model to be used to apply action on, [Optional]
| read.modeloptions   | `JSON` |         | Options to pass to your model define above
| read.modelscope   | `String`\|`false` |       | `false` to use unscoped model and avoid any default scope applied on model, or use define scope to use as string
| action_to_execute| `String` | `null` | Action to perform on defined model <br/> supported default actions are  <br/> - `vnatk_add`: pass arg_item data to create a new record of given model. <br/> - `vnatk_edit`: pass arg_item data to edit model record, arg_item must have primary/autoincrement value availabe, model will be loaded by that value and all other values passed will be updated on model. <br/> - `vnatk_delete`: pass arg_item data to delete model record, arg_item must have primary/autoincrement value availabe, model will be loaded by that value and then destroys. <br/> - `{Any User Defined Method Name}`: pass arg_item data to your method defined in Model class/declatation. <p>Actions retuns data of added/edited/deleted item, but in any case modeloptions contains some condition that is changed due to editing, `null` is returned instead</p>
| arg_item| `JSON` | `null` | Argument passed for your action, for `vnatk_edit` and `vnatk_delete` actions, arg_item must have id or your primary key value to pick correct record, while for `vnatk_add` action data passed will be used to create fill in `model.create`.

---

## Examples

### vnatk_add
### vnatk_edit
### vnatk_delete
### vnatk_autoimport
### User defined functions
