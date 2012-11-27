
Ext.onReady(function(){

BugfixTreePanel = Ext.extend(Ext.tree.TreePanel, {
    // private
    renderIndent : function(deep, refresh){
        if(refresh){
            //this.ui.childIndent = null;
        }
        this.ui.renderIndent();
        if(deep === true && this.childrenRendered){
            var cs = this.childNodes;
            for(var i = 0, len = cs.length; i < len; i++){
                cs[i].renderIndent(true, refresh);
            }
        }
    }
});

ItemTreePanel = Ext.extend(BugfixTreePanel, {
    initComponent: function(config){
        config = config || {};
        Ext.apply(config, {
            height: 200,
            width: 200,
            //header: 'asdf',
            root: {
                text: 'Bitte Template auswählen...',
                draggable: false,
                id: 'root'
            },
            dataUrl: '/itemTree',
            autoScroll: true
            
        });
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        ItemTreePanel.superclass.initComponent.call(this, config);
    }
});

ItemDetailTreePanel = Ext.extend(BugfixTreePanel, {
    initComponent: function(config){
        config = config || {};
        Ext.apply(config, {
            height: 200,
            width: 200,
            //header: 'asdf',
            root: {
                text: 'Bitte Template auswählen...',
                draggable: false,
                id: 'root'
            },
            dataUrl: '/itemDetailTree',
            autoScroll: true
            
        });
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        ItemTreePanel.superclass.initComponent.call(this, config);
    }
});


TemplateContainsTreePanel = Ext.extend(BugfixTreePanel, {
    initComponent: function(config){
        config = config || {};
        Ext.apply(config, {
            height: 200,
            width: 200,
            //header: 'asdf',
            root: {
                nodeType: 'async',
                text: 'Bitte Template auswählen...',
                draggable: false,
                id: 'root'
            },
            dataUrl: '/templateContainsTree'
            
        });
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        TemplateContainsTreePanel.superclass.initComponent.call(this, config);
    }
});

TemplateBelongsTreePanel = Ext.extend(BugfixTreePanel, {
    initComponent: function(config){
        config = config || {};
        Ext.apply(config, {
            height: 100,
            width: 200,
            showRoot: false, 
            //header: 'asdf',
            root: {
                nodeType: 'async',
                draggable: false,
                id: 'root'
            },
            rootVisible: false,
            dataUrl: '/templateBelongsTree',
            autoScroll: true
            
        });
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        TemplateBelongsTreePanel.superclass.initComponent.call(this, config);
    }
});


NewTemplateForm = Ext.extend(Ext.form.FormPanel, {
    initComponent: function(config){
        config = config || {};
        
        var parentTree = new BugfixTreePanel({
            fieldLabel: 'Eltern-Komponente',
            enableDD: true,
            rootVisible: false,
            dataUrl: '/templateBelongsTree',
            root: {
                id: 'root'
            }
        });
        
        Ext.apply(config, {
            layout: 'form',
            title: 'Neues Template',
            url: 'newTemplateForm',
            //height: 100,
            //width: 200,
            items: [
                {xtype: 'textfield', fieldLabel: 'Name', name: 'template_name'},
                parentTree    
            ],
            buttons: [{
                text: 'Speichern',
                handler: function(){
                    var parent = parentTree.getSelectionModel().getSelectedNode();
                    this.getForm().submit({params: {parentNode: parent.id}});
                },
                scope: this
            }]
        });
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        NewTemplateForm.superclass.initComponent.call(this, config);
    }
});


AddTemplateWin = Ext.extend(Ext.Window, {
    getSelectedNode: function(){
        return this.tree.getSelectionModel().getSelectedNode();
    },
    
    initComponent: function(config){
        config = config || {};
        this.tree = new TemplateBelongsTreePanel();
        Ext.apply(config, {
            title: 'Neues Template hinzufügen',
            items: this.tree,
            buttons: [{
                text: 'Hinzufügen',
                handler: function(){ this.hide(); },
                scope: this
            }]
        });
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        AddTemplateWin.superclass.initComponent.call(this, config);
    }
});


/*
TODO: die auswahl der komponentenart sollte deutlicher machen, dass hier normalerweise nur eine art ausgewaehlt werden muss,
      und dass im ausnahmefall weitere arten hinzugefuegt werden koennen. ausserdem muss klar werden, dass die art zuerst ausgewaehlt werden muss.
      "komponentenart auswahlen" + "weitere art hinzufuegen"

*/
NewItemForm = Ext.extend(Ext.form.FormPanel, {
    makeTemplateGrid: function(){
        return new Ext.grid.GridPanel({
            fieldLabel: 'Komponentenart',
            store: new Ext.data.ArrayStore({
                fields: ['node_id', 'name'], 
                data: [['dummy', 'Bitte Template hinzufügen']]
            }),
            columns: [{dataIndex: 'name', id: 'name'}],
            autoExpandColumn: 'name',
            hideHeaders: true,
            height: 100,
            bbar:[{
                text: 'Template hinzufuegen',
                handler: function(){
                    var win = new AddTemplateWin();
                    win.on('hide', this.loadNewTemplate, this);
                    win.show();
                },
                scope: this
            }]
        });
    },
    
    makePropertyGrid: function(){
        return new Ext.grid.EditorGridPanel({
            fieldLabel: 'Properties',
            store: new Ext.data.JsonStore({
                fields: ['name', 'value', 'property_id'],
                url: 'newItemForm_propertyGrid'
            }),
            columns: [
                {dataIndex: 'name', header: 'Name'}, 
                {dataIndex: 'value', header: 'Wert', editor: new Ext.form.TextField}
            ],
            height: 100
        });
    },
    
    makeSubItemsGrid: function(){
        /*
        When a sub item is selected in a combobox, the name of the sub item is
        written into the store of the grid. The ID of the sub item is stored 
        manually by the handler of the Ext.grid.GridEditor which wraps the combobox
        */
        var subItemsStore = new Ext.data.JsonStore({
            fields: ['name', 'value_name', 'value_id', 'node_id'],
            url: 'newItemForm_subItemGrid'
        });
        subItemsStore.on('update', function(store, record, operation){
            console.log('update', record.id, operation, record.get('value_name')    )
        });
            
        var colModel = new Ext.grid.ColumnModel({
            columns: [
                {dataIndex: 'name', header: 'Template'}, 
                {dataIndex: 'value_name', header: 'Item', editable: true}
            ],
            
            makeComboboxEditor: function(record){
                var combo = new Ext.form.ComboBox({
                    store: new Ext.data.JsonStore({
                        fields: ['name', 'item_id'],
                        idProperty: 'item_id',
                        url: 'newItemForm_subItemCombo',
                        baseParams: {template_id: record.get('node_id')},
                        autoLoad: true
                    }),
                    displayField:'name',
                    valueField: 'item_id',
                    typeAhead: true,
                    triggerAction: 'all',
                    emptyText:'Auswaehlen...',
                    selectOnFocus:true,
                });
                
                var comboEditor = new Ext.grid.GridEditor(combo);
                
                /* The item selected in the combo box is written manually to the 
                record, because we have to save both item_id and item_name into
                the record. The item_name should be shown in the grid whereas the 
                item_id should be submitted. */
                comboEditor.on('beforecomplete', function(editor, value){   
                    var subItemName = combo.getStore().getById(value).get('name');
                    record.set('value_id', value);
                    record.set('value_name', subItemName);
                    return false;
                }, this);
                
                return comboEditor;
            },
            
            getCellEditor: function(colIndex, rowIndex) {
                var record = subItemsStore.getAt(rowIndex);
                var editor = this.makeComboboxEditor(record);
                return editor;
            }
        });
        
        return new Ext.grid.EditorGridPanel({
            fieldLabel: 'Sub items',
            store: subItemsStore,
            cm: colModel,
            height: 200
        });
    },
    
    loadNewTemplate: function(win){
        var node = win.getSelectedNode();
        
        var templateStore = this.templateGrid.getStore();
        if (templateStore.getCount() === 1 && templateStore.getAt(0).data.node_id === 'dummy'){
            templateStore.removeAt(0);
        }
        var record = new templateStore.recordType({name: node.text, node_id: node.id}, node.id);
        templateStore.add([record]);
        
        this.propertyGrid.getStore().load({params: {add: true, template_node: node.id}})
        this.subItemsGrid.getStore().load({params: {add: true, template_node: node.id}})
    },
    
    saveItem: function(){
        var name = this.nameField.getValue();
        
        var templates = [];
        this.templateGrid.getStore().each(function(r){
            templates.push(r.get('node_id'));
        });
        
        var properties = [];
        this.propertyGrid.getStore().each(function(r){
            if (r.get('value') !== ''){
                properties.push({
                    property_id: r.get('property_id'),
                    value: r.get('value')
                });
            }
        });
        
        var subItems = [];
        this.subItemsGrid.getStore().each(function(r){
            if (r.get('value_id') !== ''){
                subItems.push({
                    template_id: r.get('node_id'),
                    item_id: r.get('value_id')
                });
            }
        });
        
        this.getForm().submit({
            params: {
                jsondata: Ext.encode({
                    templates: templates, 
                    properties: properties, 
                    subItems: subItems
                })
            },
            url: 'newItemForm_submit'
        });
    },

    initComponent: function(config){
        config = config || {};
        
        this.nameField = new Ext.form.TextField({fieldLabel: 'Name', name: 'template_name', width: '100%'});
        this.templateGrid = this.makeTemplateGrid();
        this.propertyGrid = this.makePropertyGrid();
        this.subItemsGrid = this.makeSubItemsGrid();
        
        Ext.apply(config, {
            layout: 'form',
            title: 'Neues Template',
            url: 'newTemplateForm',
            bodyStyle:'padding:5px 5px 0',
            //height: 100,
            //width: 200,
            items: [
                this.nameField,
                this.templateGrid,
                this.propertyGrid,
                this.subItemsGrid
            ],
            buttons: [{
                text: 'Speichern',
                handler: this.saveItem,
                scope: this
            }]
        });
        Ext.apply(this, Ext.apply(this.initialConfig, config));
        NewTemplateForm.superclass.initComponent.call(this, config);
    }
});


ItemPanel = Ext.extend(Ext.Window, {
    showNewTemplate: function(){
        var win = new Ext.Window({
            x: 10,
            y: 10,
            height: 300,
            width: 400,
            layout: 'fit',
            items: new NewTemplateForm()
        });
        win.show();
    },
    
    showNewItem: function(){
        var win = new Ext.Window({
            x: 10,
            y: 10,
            height: 500,
            width: 400,
            layout: 'fit',
            items: new NewItemForm()
        });
        win.show();
    },
    
    initComponent: function(config){
        var belongs = new TemplateBelongsTreePanel({border: true, region: 'center'});
        var contains = new TemplateContainsTreePanel({region: 'east', title: 'Enthaltene Komponenten', split: true});
        var items = new ItemTreePanel({region: 'center'});
        var itemDetails = new ItemDetailTreePanel({region: 'east', split: true, title: 'Details'})
        
        items.on('click', function(node, event){
            if (node.id !== 'root'){
                var node = new Ext.tree.AsyncTreeNode({
                    id: node.id,
                    text: node.text,
                    expanded: true
                });
                itemDetails.setRootNode(node);           
            }        
        });
        
        belongs.on('click', function(node, event){
            if (node.id !== 'root'){
                var node = new Ext.tree.AsyncTreeNode({
                    id: node.id,
                    text: node.text,
                    expanded: true
                });
                items.setRootNode(node);
                
                var node = new Ext.tree.AsyncTreeNode({
                    id: node.id,
                    text: node.text,
                    expanded: true
                });
                contains.setRootNode(node);
            }
        });
        
        contains.on('click', function(node, event){
            if (node.id !== 'root'){
                var node = new Ext.tree.AsyncTreeNode({
                    id: node.id,
                    text: node.text,
                    expanded: true
                });
                items.setRootNode(node);
                
                var node = new Ext.tree.AsyncTreeNode({
                    id: node.id,
                    text: node.text,
                    expanded: true
                });
                contains.setRootNode(node);
            }
        });
    
    
        config = config || {};
        Ext.apply(config, {
            //header: 'xxx',
            height: 500,
            width: 500,
            items: [ 
                new Ext.Panel({
                    title: 'Templates',
                    region: 'center',
                    split: true,
                    layout: 'border',
                    items: [belongs, contains],
                    tbar: [{
                        text: 'Neues Template',
                        handler: this.showNewTemplate,
                        scope: this
                    }]
                }),
                new Ext.Panel({
                    title: 'Komponenten',
                    region: 'south',
                    height: 200,
                    split: true,
                    layout: 'border',
                    items: [items, itemDetails],
                    tbar: [{
                        text: 'Neue Komponente',
                        handler: this.showNewItem,
                        scope: this
                    }]
                })
            ],
            layout: 'border'
            
        });  

        Ext.apply(this, Ext.apply(this.initialConfig, config));
        ItemPanel.superclass.initComponent.call(this, config);
    }
});



var p = new ItemPanel();
//p.render('grid');
p.show();
});