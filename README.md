## ALPHA/BETA - Under heavy development and not for production use
---

Master-branch: ![Vnatk-tests](https://github.com/gowrav-vishwakarma/vnatk-express-sequelize/workflows/Vnatk-tests/badge.svg?branch=master) Develop-branch: ![Vnatk-tests](https://github.com/gowrav-vishwakarma/vnatk-express-sequelize/workflows/Vnatk-tests/badge.svg?branch=develop)

# VNATK

VNATK is a set of client and server frameworks set to get your work started ASAP, Trying to be most Rapid system with total customization in hand.

VNATK is developed to keep the following few points in mind
- Most of the time we spend time in creating trivial APIs, that actually are identical with different models.
- we all know how tesdius it is to do maintenance of any project specially when client/company is ever changing their requirements. By looking at those issue I was missing somehting that really is fast, really RAPID APPLICATION DEVELOPMENT (RAD) framework.

VNATK-EXPRESS-SEQULIZE is implementation of Sequlize-QL (Given name as per Graph-QL) that can be used as independent tool to ease your API development.

The main purpose though to develop VNATK-EXPRESS-SEQULIZE is to provide API-Less server system for VNATK framework. It works in combination with its counter front part like VUEATK-VUE [https://github.com/gowrav-vishwakarma/vnatk-vue]

# VNATK-EXPRESS-SEQULIZE (Backend with Express and Squelize)
---

Equipped with a few endpoints that gives you all power with Sequalized-QL developed and defined by this project only.

This express middleware will give all the fule required from server to VNATK Frontend Frameworks. And this can also be used as independent API provider (inspired from Graph-QL).

Dependencies: body-parser, debug, dotenv,lodash, sequelize and your sequlize dialect
# Step 1.0: setup express app
Considering we are in "Your Project Root Folder"

lets create express app (Server/service) from scratch, you are welcome to use any other way or manual if you know what you are doing

```bash
### FOR NEW SERVICE SETUP

#install express-generator globally, its easy to do setup with this
$yourProjectRoot> npm install -g express-generator
...
$yourProjectRoot> express server --no-view
...
#lets check if a folder with server name created or not
$yourProjectRoot> ls
server

#a default structure is also created in this folder
$yourProjectRoot> ls server
app.js       package.json routes    bin          public

$yourProjectRoot> cd server

#lets install basic things setup by express-generator
$yourProjectRoot/server> npm install

#install our dependencies now
$yourProjectRoot/server> npm install --save bcrypt body-parser cookie-parser express-handlebars jsonwebtoken morgan cors dotenv lodash mysql2 sequelize vnatk-express-sequelize

### If required vnatk-express-sequelize can be installed in existing express seuelize setup also with very ease

#install sequelize cli for easy sequlize setup
$yourProjectRoot/server> npm install --save-dev sequelize-cli
$yourProjectRoot/server> sequelize init

```

sometimes sequelize have issues in reading models from file like this specially if your sequlize cli is old and you are  using seulize v6, in case of that, you may get sequelize import method error.

replace following line in that case

```js
// replace following line 
const model = sequelize['import'](path.join(__dirname, file));
//  to this line
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes)
```

## Step 2.0: configure and use vnatk-express-sequelize

Please add the following code in your `app.js` file. (DON'T COPY PASTE WHOLE CODE, ITS NOT FULL FILE CODE) 

`app.js`
```javascript
// somewhere on the top after 
// var express = require('express'); <= after this line
var cors = require('cors');
const bodyParser = require('body-parser');
const vnatk = require('vnatk-express-sequelize');
...
...
// You can already have body-parser added, no need to add again
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true }));

// add cors is a good way and mostly you might need this also
app.use(cors()); // Use this after the variable declaration

var VnatkRouter = require('./routes/vnatk.js');
app.use('/vnatk', VnatkRouter); // '/vnatk' is called basepath here

```

Now create a new file to export Vnatk Routes
`routes/vnatk.js`

```javascript
var express = require('express');
var router = express.Router();
const vnatk = require('vnatk-express-sequelize');

// Optional to use some auth middleware on this route
//router.use(require('./middleware/adminTokenChecker'));

const Models = require('../../models');
module.exports = vnatk({ 
    Models: Models,
    router: router
});

```

### Step 2.1: setup Models

Create models in ```models``` folder. For more about Models in sequlize please follow sequlize documentations.

Let's have a sample model. Please read Model comments as documentation. Some properties and methods are specific to VNATK-Frontend here, feel free to skip if using only vnatk-express-sequelize for API only.


```javascript
'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define association here
      // City and State Models must be created in same manner in models folder also
      User.belongsTo(models.City, { foreignKey: 'city_id' });
      User.belongsTo(models.State, { foreignKey: 'state_id' });

    }
    
    // Functions that will be called on loaded model
    // In other way of sequlize you define instance variable as 
    // sequelize.prototype=function () { ... }
    deActivate(args) {
      this.status = 'InActive'
      return this.save().then(self => {
        return self;
      })
    }

    activate(args) {
      this.status = 'Active'
      return this.save().then(self => {
        return self;
      })
    }

    block(args) {
      this.status = 'Blocked'
      return this.save().then(self => {
        return self;
      })
    }

  }

  // This init method is defined by 'define' method in other sequelize ways. technically its same ...

  User.init(
    {
      name: {
        type: DataTypes.STRING,
      },
      email: {
        validate: { isEmail: true },
        type: DataTypes.STRING,
        defaultValue: 'guest@example.com'
      },
      mobile: {
        type: DataTypes.STRING,
        validate: {
          isNumeric: {
            msg: 'Mobile number can only contains number',
            args: true
          },
        },
      },
      password: {
        type: DataTypes.STRING,
      },
      status: DataTypes.ENUM('Applied', 'Active', 'InActive', 'Blocked'),
      createdAt: {
        type: DataTypes.DATE,
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        field: 'updated_at',
      }
    },
    {
      sequelize,
      modelName: 'User',
    }
  );
  return User;
};
```

thats it... Start using the API at ease if not using VNATK-VUE or let's setup Vue frontend now, please follow VUEATK-VUE [https://github.com/gowrav-vishwakarma/vnatk-vue]


# API Basics

NOTE: ALL APIs in Sequlize-QL are POST APIs

vnatk-express-sequlize provides two APIs
- {base_path}/crud (POST)
This API is used to read data, DON'T GET CONFUSED with CRUD Name, this API DO NOT Create., Update or Delete. Instead, the API do provide infromation about Create, Update, Delete and Actions to work in combination with VNATK-VUE Fronetnd.

- {base_path}/executeaction (POST)
This API is responsible for various actions includeing Create, Update, Delete and Other Methods on Models.

`{base_path}/crud` options 
---

### Options for API only

| Option      | Type        | Default | Description 
| ----------- | ----------- | --------| ----
| model       | `String`      | `null`  | Model name to work on, [Mendatory]
| read   | `JSON`        | {} | options for read operations, [Optional]
| read.modeloptions   | `JSON` |         | Options to pass to your model define above
| read.modelscope   | `String`\|`false` |       | `false` to use unscoped model and avoid any default scope applied on model, or use define scope to use as string
| read.autoderef   | `Boolean`       | `true` | Try to solve belongsTo relation and get name/title of related field ie cityId to City.name (Auto includes)
| read.headers   | `Boolean`       | `true` | Sends headers infor about fields included for UI processing, Mainly used by VNATK-VUE, you can set to `false` is only using APIs.
| actions   | `Boolean`       | `true` | Sends Actions applicable including Create, Update and Delete and their formschema, set to `false` if using in API only mode.


There are more rich set of options applicable when using with VNATK-VUE. To know more about those options pls follow VUEATK-VUE [https://github.com/gowrav-vishwakarma/vnatk-vue]


`{base_path}/executeaction` options 
---

| Option      | Type        | Default | Description 
| ----------- | ----------- | --------| ----
| model       | `String`      | `null`  | Model name to work on, [Mendatory]
| read   | `JSON`        | {} | options for model to be used to apply action on, [Optional]
| read.modeloptions   | `JSON` |         | Options to pass to your model define above
| read.modelscope   | `String`\|`false` |       | `false` to use unscoped model and avoid any default scope applied on model, or use define scope to use as string
| action_to_execute| `String` | `null` | Action to perform on defined model <br/> supported default actions are  <br/> - `vnatk_add`: pass arg_item data to create a new record of given model. <br/> - `vnatk_edit`: pass arg_item data to edit model record, arg_item must have primary/autoincrement value availabe, model will be loaded by that value and all other values passed will be updated on model. <br/> - `vnatk_delete`: pass arg_item data to delete model record, arg_item must have primary/autoincrement value availabe, model will be loaded by that value and then destroys. <br/> - `{Any User Defined Method Name}`: pass arg_item data to your method defined in Model class/declatation. <p>Actions retuns data of added/edited/deleted item, but in any case modeloptions contains some condition that is changed due to editing, `null` is returned instead</p>
| arg_item| `JSON` | `null` | Argument passed for your action, for `vnatk_edit` and `vnatk_delete` actions, arg_item must have id or your primary key value to pick correct record, while for `vnatk_add` action data passed will be used to create fill in `model.create`.

---

#### Changes in read.modeloptions from standard Sequlize model options

```javascript
{
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
          $lt: 18 // <== operator aliases defined in config.js file
        }
      }
    },
    modelscope:false // <== false for unscoped User or String for scope name for User model
  }
}
```

Under development:
Authorization and ACL based on each Model or record is under development