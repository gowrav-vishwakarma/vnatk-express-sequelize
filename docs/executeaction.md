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

## Pre defined actions

### vnatk_add

Create single record of any model in flat manner (To create deep relational records please see `vnatk_autoimport`)

```javascript

let createRecordOption = {
  model: 'User',
  modelscope: false, // After create re-load record unscoped
  action_to_execute: {execute: 'vnatk_add', name: 'vnatk_add'},
  arg_item: {
      name : 'Foo',
      bar: 'Bar'
  },
}

// Calling by axios
service.post('/vnatk/executeaction',crudOptions).then(response=>{
    // newly created record loaded with default modelscope if modelscope is not set to false.
})
```


### vnatk_edit

Edit any record by sending data along with id field value. this action updates flat record of any model, to update nested related complex condition based data, please see `vnatk_autoimport`.

```javascript

let createRecordOption = {
  model: 'User',
  modelscope: false, // After update re-load record unscoped
  action_to_execute: {execute: 'vnatk_edit', name: 'vnatk_edit'},
  
  arg_item: {
      id: 1
      name : 'Foo',
      bar: 'Bar'
  },
}

// Calling by axios
service.post('/vnatk/executeaction',crudOptions).then(response=>{
    // newly created record loaded with default modelscope if modelscope is not set to false.
})
```
### vnatk_delete

Delete any record by sending model and its id field value. 

Do not worry about misuse of the APIs, you have full controll over who can actually execute these apis. Please visit `safety and security` section.

```javascript

let createRecordOption = {
  model: 'User',
  modelscope: false, // After update re-load record unscoped
  action_to_execute: {execute: 'vnatk_delete', name: 'vnatk_delete'},
  arg_item: {
      id: 1
  },
}

// Calling by axios
service.post('/vnatk/executeaction',crudOptions).then(response=>{
    // sends success message on complete
})
```

### vnatk_autoimport

The most interesting action that actually can replace `vnatk_add` and `vnatk_edit` both in one go with more control over what you want to do.

As the name suggests, this action can import multiple records in one go, including nested deep relational structured json data.

The strcuture of API payload is as follows

```javascript
{
    action_to_execute: { execute: 'vnatk_autoimport', name: 'vnatk_autoimport' },
    importdata: importdata, // Array of objects, each object represents one record, flat or nested
    model: String, // model name to start import into
    transaction: String // ("row" or "file"), to make transaction all record based or one transaction per recrod
}
```
here importdata object is JSON data with following special properties to define action for data

* `$vnatk_data_handle`: How you want to handle specific record, you can use the option nested for each nested data also.
Possible values are 
    * `alwaysCreate` [default]: Record is always inserted
    * `findOrCreate`: Find by matching all values that are passed or by using `$vnatk_find_options` if defined to find, if not found, create a new record.
    * `findAndUpdateOrCreate`: Find by matching all values that are passed or by using `$vnatk_find_options` if defined to find and then update changed values passed in object (field:value), if not found, create a new record.
    * `findToAssociate`: For nested records, try find existing record, if found use its relational key to associate with parent record or produce error if not found.
    * `associateIfFound`: For nested records, try find existing record, if found use its relational key to associate with parent record or ignore if not found

* `$vnatk_find_options`: Use this as where condition in sequelize models to find if vnatk_data_handle is to find record first
* `$vnatk_cache_records`: Under development: To cache any record if already found, to avoid multiple database queires.
* `$vnatk_update_data`: Under development: update values defined here instead all values passed to create if not found.

#### vnatk_autoimport example

Lets consider a data structure first, and then import/add/edit data based on VES `executeaction` api on `vnatk_autoimport` action.

```javascript
//Gorup.js model
module.exports = (sequelize, DataTypes) => {
    const Group = sequelize.define('Group', {
        name: DataTypes.STRING,
    }, {});
    Group.associate = function (models) {
        Group.hasMany(models.User, {
            foreignKey: 'groupId',
            as: 'GroupUsers'
        })
    };
    return Group;
};

// User.js
module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING
    }, {});
    User.associate = function (models) {
        // associations can be defined here
        User.belongsTo(models.Group, {
            foreignKey: 'groupId',
            as: 'Group'
        })
        User.hasMany(models.Project, {
            foreignKey: 'adminId',
            as: 'ProjectsOwned'
        })
        User.belongsToMany(models.Project, {
            foreignKey: 'adminId',
            as: 'Projects',
            through: models.UserProjects
        })
    };
    return User;
};

// Skill.js
module.exports = (sequelize, DataTypes) => {
    const Skill = sequelize.define('Skill', {
        name: DataTypes.STRING,
    }, {});
    Skill.associate = function (models) {
        // associations can be defined here
        Skill.belongsTo(models.User, {
            foreignKey: 'userId',
            as: 'SkillOwner'
        })
    };
    return Skill;
};

// Project.js
module.exports = (sequelize, DataTypes) => {
    const Project = sequelize.define('Project', {
        title: DataTypes.STRING,
        imageUrl: DataTypes.STRING,
        description: DataTypes.TEXT,
        adminId: DataTypes.INTEGER
    }, {});
    Project.associate = function (models) {
        Project.belongsTo(models.User, {
            foreignKey: 'adminId',
            onDelete: 'CASCADE',
            as: 'ProjectAdmin'
        })
        Project.belongsToMany(models.User, {
            foreignKey: 'adminId',
            onDelete: 'CASCADE',
            as: 'ProjectUsers',
            through: models.UserProjects
        })
    };
    return Project;
};

// UserProjects.js
module.exports = (sequelize, DataTypes) => {
    const UserProjects = sequelize.define('UserProjects', {
        assignedOn: DataTypes.DATE,
        remarks: DataTypes.STRING,
        isDone: DataTypes.BOOLEAN,
    }, {});
    UserProjects.associate = function (models) {
        UserProjects.belongsTo(models.Project, {
            foreignKey: 'projectId'
        });

        UserProjects.belongsTo(models.User, {
            foreignKey: 'userId'
        });

        UserProjects.hasMany(models.UserProjectRemarks, {
            foreignKey: 'userProjectId'
        });

    };
    return UserProjects;
};

// UserProjectRemarks.js
module.exports = (sequelize, DataTypes) => {
    const UserProjectRemarks = sequelize.define('UserProjectRemarks', {
        remarks: DataTypes.STRING,
    }, {});
    UserProjectRemarks.associate = function (models) {
        UserProjectRemarks.belongsTo(models.UserProjects, {
            foreignKey: 'userProjectId',
            as: 'ProjectRemarks'
        })
    };
    return UserProjectRemarks;
};

```

Quite a complex structure to start with, but the power of VES only comes to proper view with such an example.

Lets create/import a record for this strcuture with following JSON payload. read comments to understand each line well.

```javascript

let CreateOrImport = {
    model: 'User',
    modelscope: false, // After update re-load record unscoped
    action_to_execute: {execute: 'vnatk_autoimport', name: 'vnatk_autoimport'},
    transaction: 'file',
    importdata: [{
        $vnatk_data_handle = "findOrCreate"; // find as per below vnatk_find_options, if not found create by field values
        $vnatk_find_options: {
            modeloptions:{
                where:{
                    email: 'foo@bar.com'
                }
            },
            modelacope: false // to avoid any default acope in case
        },
        firstName: 'UserFirstName',
        lastName: 'UserLastName',
        email: 'foo@bar.com',
        password: 'anyPassword'

        // This User belongs to a Group that we also want to findOrCreate
        // Belongs to are defined as Object, Once found/created Group id will be associated with User as well
        Group: {
            $vnatk_data_handle = "findOrCreate"; // find as per below vnatk_find_options, if not found create by field values
            $vnatk_find_options:{
                modeloptions: {
                    where:{
                        name: 'MyFirstGroup'
                    }
                },
                modelscope: false // To use unscoped model (in case defaultscope is set to active only)
            },
            name: 'MyFirstGroup'
        }

        // Lets add some hasMany records for this User
        // has Many records are always passed as Array of Objects
        Skills: [
            {
                name: 'skill_1',
                $vnatk_data_handle: "findOrCreate", // Since no $vnatk_find_options is passed all fields (here is only one) will be used to find record
            }
            {
                name: 'skill_2',
                $vnatk_data_handle: "findOrCreate", // Since no $vnatk_find_options is passed all fields (here is only one) will be used to find record
            }
        ]

        // User has two relations with Projects, as HasMany ProjectsOwned and belongsToMany as Projects
        // lets define HasMany data first.
        // following key must match 'as' prperty defined in sequleize model relation.
        ProjectsOwned: [
            {
                title: 'Project Title 1',
                description: 'Project Description',
                code: 'PRJ1',
                $vnatk_data_handle: "findAndUpdateOrCreate", // if found, update admin Id to this user id
                $vnatk_find_options: {
                    modeloptions: {
                        where:{
                            code: 'PRJ1',
                        }
                    },
                    modelscope: false,
                },
            },
            {
                title: 'Project Title 2',
                description: 'Project Description 2',
                code: 'PRJ2',
                $vnatk_data_handle: "findAndUpdateOrCreate", // if found, update admin Id to this user id
                $vnatk_find_options: {
                    modeloptions: {
                        where:{
                            code: 'PRJ2',
                        }
                    },
                    modelscope: false,
                },
            }

            // User belongs To many Projects with Through relation, lets create them as well
            // belongs to are also defined as Array of Objects, where object denotes through table and that consists of belongsTo record entry, User id will be inserted automatically by VES
            // following key must match 'as' prperty defined in sequleize model relation.

            Projects: [
                {
                    $vnatk_data_handle: "findOrCreate", // find will be based on relational keys here
                    assignedOn: "1970-01-01", // fields in through table
                    isDone: false, // field in through table
                    Project: {
                        // through model belongsTo Project is defined here
                        title: 'Project title 1',
                        $vnatk_data_handle: "findOrCreate",
                        $vnatk_find_options: {
                            modeloptions: {
                                where:{
                                    code: 'PRJ1',
                                }
                            },
                        },
                    },
                    // Projects many to many relation also contains hasMany relation of remarks
                    UserProjectRemarks:[
                        {
                            // Since no $vnatk_data_handle is defined it is assumed to be alwaysCreated
                             remarks: 'Remark one',
                        },
                        {
                            // Since no $vnatk_data_handle is defined it is assumed to be alwaysCreated
                             remarks: 'Remark two',
                        }
                    ]
                },
                {
                    $vnatk_data_handle: "findOrCreate", // find will be based on relational keys here
                    assignedOn: "1970-01-01", // fields in through table
                    isDone: true, // field in through table
                    Project: {
                        // through model belongsTo Project is defined here
                        title: 'Project Title 3',
                        $vnatk_data_handle: "findOrCreate",
                        $vnatk_find_options: {
                            modeloptions: {
                                where:{
                                    code: 'PRJ3',
                                }
                            },
                        },
                    },

                    UserProjectRemarks:[
                        {
                            remarks: 'remark 3'
                        }
                    ]
                }
            ]
        ]
    }],
}

// Calling by axios
service.post('/vnatk/executeaction',crudOptions).then(response=>{
    // response contains information about your import data
})
```

Since `importdata` is an array, you can send multiple records each with nested data to have your records created or imported as well. `vnatk-vue`, allows you to convert csv/excel flat data to convert in this nested way by `rowformatter` option in `import` and then the same action is executed. 

### User defined methods

In case you want to execute any other method in your model you can simple change your action_to_execute.execute property to method name and arg_item will be passed to the method of your model

```javascript

// Considering your model do have a method named sendEmail accepting some parameter as object.

let createRecordOption = {
  model: 'User',
  modelscope: false, // After update re-load record unscoped
  action_to_execute: {execute: 'sendEmail'},
  arg_item: { // this object will be passed to your method
      user_email: 'foo@bar.com'
  },
}

// Calling by axios
service.post('/vnatk/executeaction',crudOptions).then(response=>{
    // sends success message on complete
})
```


## Safety and Security

vnatk-express-sequelize, while provide you endpoints to do almost anything without writing code, also provides you three levels of access controls (more are under development)
- By providing access token checker middelware

```javascript
var express = require('express');
var router = express.Router();
const vnatk = require('vnatk-express-sequelize');

// THIS LINE TO USE AUTHENTICATION CHECKER
router.use(require('./middleware/adminTokenChecker'));

const Models = require('../../models');
module.exports = vnatk({ 
    Models: Models,
    router: router
});

```

- Providing whiteList/Blacklist models

Example: in your vnatk routes file plass options as follows

```javascript
var express = require('express');
var router = express.Router();
const vnatk = require('vnatk-express-sequelize');

router.use(require('./middleware/adminTokenChecker'));

const Models = require('../../models');
module.exports = vnatk({ 
    Models: Models,
    router: router,
    // allow only following models
    whitelistmodels:['Products','Cart'],
    // do not allow following models
    blacklistmodels:['Orders','Payments']
});

```

- Providing each actions authorization function in model itself

Example

Each action checks for `can_{action}` function in model, if found, the function is called `by passing request object`. on receiving `===` true only then the related action is executed.

four default actions for basic VES options are `vnatk_add`, `vnatk_edit`,  `vnatk_delete` and `vnatk_autoimport`. To make authorization related to these actions you may created `can_vnatk_add`, `can_vnatk_edit`, `can_vnatk_delete` and `can_vnatk_autoimport` function in models respectiley.


Under development:
Authorization and ACL based on each Model or record is under development