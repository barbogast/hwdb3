from twisted.application import service, internet
from twisted.internet.defer import inlineCallbacks, returnValue
from nevow import appserver, rend, inevow, loaders, flat, static, tags as T
from nevow.url import URL
import psycopg2
import simplejson

#import model01 as model
#import simpleview_02 as simpleview

"""
Umbenennungen:
item oder component
template_belongs_to oder template_belongs
parent_xxxx_id ==> parent_id
child_xxxx_id ==> child_id


"""


def jsonify(func):
    """
    Decorator for a nevow request
    """
    @inlineCallbacks
    def wrapper(*args, **kwargs):
        ctx = args[1]
        request = inevow.IRequest(ctx)
        request.setHeader("Content-Type","application/json; charset=UTF-8")
        result = yield func(*args, **kwargs)
        jsonresult = simplejson.dumps(result)
        request.write(jsonresult)
        returnValue('')
    
    return wrapper


def convertRequestToForm(ctx):
    req = inevow.IRequest(ctx).args
    result = {}
    for key in req.keys():
        if len(req[key]) > 1:
            # list type
            result[key] = req[key]
        else:    
            tmpval = req[key][0]
            if tmpval == '':
                result[key] = None
            else:
                result[key] = tmpval
    return result


class Model(object):
    @staticmethod
    def initDb():
        return psycopg2.connect(host='localhost', port=5432, database='devel', user='postgres')
    
    def __init__(self):
        self.conn = Model.initDb()
        
    def itemTree(self, template_id):
        cur = self.conn.cursor()
        stmt = """select i.id, i.name from items.item i, items.template t
                       where t.id = %s and t.id = i.template_id"""
        cur.execute(stmt, template_id)
        items = []
        for row in cur.fetchall():
            items.append({'id': row[0], 'text': row[1]})
        return items
        
    def itemDetailTree(self, node):
        cur = self.conn.cursor()
        if node == 'root':
            stmt = """select i.id, i.name, t.name from items.item i, items.template t
            where i.template_id = t.id and 
            i.id not in (select distinct child_item_id from items.item_contains)"""
            cur.execute(stmt)
        else:
            stmt = """select i.id, i.name, t.name from items.item i, items.template t where 
                i.template_id = t.id and 
                i.id in (select child_item_id from items.item_contains where parent_item_id = %s)"""
            cur.execute(stmt, (node,) )
        
        res = cur.fetchall()

        items = []
        for el in res:
            items.append({'id': el[0], 'text': '[%s] %s'%(el[2], el[1])})
            
        if node != 'root':
            stmt = """select ip.item_id, ip.template_property_id, p.name, ip.property_value from 
                items.item_property ip, 
                items.template_property tp,
                items.property p
                where ip.item_id = %s and ip.template_property_id = tp.id and tp.property_id = p.id"""
            cur.execute(stmt, (node,) )
            res = cur.fetchall()
            for el in res:
                items.append({'id': '%s_%s'%(el[0], el[1]), 'text': '%s=%s'%(el[2], el[3]), 'leaf': True})
                
        return items
    
    
    def templateContainsTree(self, node):
        cur = self.conn.cursor()
        if node == 'root':
            #stmt = """select id, name from items.template where id not in (select distinct child_template_id from items.template_contains) and id in (select distinct parent_template_id from items.template_contains)"""
            #cur.execute(stmt)
            return
        else:
            stmt = """select id, name from items.template where id in (select child_template_id from items.template_contains where parent_template_id = %s)"""
            cur.execute(stmt, (node,) )
        
        res = cur.fetchall()

        items = []
        for el in res:
            items.append({'id': el[0], 'text': el[1]})
        return items
    
    
    def templateBelongsTree(self, node):
        cur = self.conn.cursor()
        if node == 'root':
            stmt = """select id, name from items.template where id not in (select distinct child_template_id from items.template_belongs_to)"""
            cur.execute(stmt)
        else:
            stmt = """select id, name from items.template where id in (select child_template_id from items.template_belongs_to where parent_template_id = %s)"""
            cur.execute(stmt, (node,) )
        
        res = cur.fetchall()

        items = []
        for el in res:
            items.append({'id': el[0], 'text': el[1]})
        return items
       

    def newTemplateForm(self, parentNode, name):
        cur = self.conn.cursor()
        stmt1 = """insert into items.template (name) values (%s) returning id"""
        cur.execute(stmt1, (name,))
        template_id = cur.fetchone()[0]
        stmt2 = """insert into items.template_belongs_to (parent_template_id, child_template_id) values (%s, %s)"""
        cur.execute(stmt2, (parentNode, template_id))
        self.conn.commit()
        return {'success': True}
    
    
    def newItemForm_propertyGrid(self, template_node):
        cur = self.conn.cursor()
        stmt1 = """select p.name, p.id from items.property p, items.template_property tp where p.id = tp.property_id and tp.template_id = %s"""
        cur.execute(stmt1, (template_node,))
        rows = cur.fetchall()
        res = []
        for row in rows:
            res.append({'name': row[0], 'property_id': row[1]})
        return res
    
    def newItemForm_subItemGrid(self, template_node):
        cur = self.conn.cursor()
        stmt1 = """select t2.name, t2.id from items.template_contains tc, items.template t1, items.template t2 where t2.id = tc.child_template_id and t1.id = tc.parent_template_id and t1.id = %s"""
        cur.execute(stmt1, (template_node,))
        rows = cur.fetchall()
        res = []
        for row in rows:
            res.append({'name': row[0], 'node_id': row[1]})
        return res
    
    def newItemForm_subItemCombo(self, template_node):
        cur = self.conn.cursor()
        stmt1 = """select i.name, i.id from items.item i where i.template_id = %s"""
        cur.execute(stmt1, (template_node,))
        rows = cur.fetchall()
        print rows
        res = []
        for row in rows:
            res.append({'name': row[0], 'item_id': row[1]})
        return res
    
    def newItemForm_submit(self, template_name, templates, properties, subItems):
        pass
        
        
        
        
        
class BasePage(rend.Page):
    docFactory = loaders.xmlfile('index.html', templateDir='templates')
    child_public = static.File('public')
    
    
    def __init__(self, model):
        self.model = model
        
    @jsonify
    @inlineCallbacks
    def child_itemTree(self, ctx):
        yield
        args = convertRequestToForm(ctx)
        res = self.model.itemTree(args['node'])
        returnValue(res)
        
    @jsonify
    @inlineCallbacks
    def child_itemDetailTree(self, ctx):
        yield
        args = convertRequestToForm(ctx)
        res = self.model.itemDetailTree(args['node'])
        returnValue(res)
        
        
    @jsonify
    @inlineCallbacks
    def child_templateContainsTree(self, ctx):
        yield
        args = convertRequestToForm(ctx)
        res = self.model.templateContainsTree(args['node'])
        returnValue(res)
        
        
    @jsonify
    @inlineCallbacks
    def child_templateBelongsTree(self, ctx):
        yield
        args = convertRequestToForm(ctx)
        res = self.model.templateBelongsTree(args['node'])
        returnValue(res)

    @jsonify
    @inlineCallbacks
    def child_newTemplateForm(self, ctx):
        yield
        args = convertRequestToForm(ctx)
        print args
        res = self.model.newTemplateForm(int(args['parentNode']), args['template_name'])
        returnValue(res)
        
    @jsonify
    @inlineCallbacks
    def child_newItemForm_propertyGrid(self, ctx):
        yield
        args = convertRequestToForm(ctx)
        print args
        res = self.model.newItemForm_propertyGrid(int(args['template_node']))
        returnValue(res)
        
    @jsonify
    @inlineCallbacks
    def child_newItemForm_subItemGrid(self, ctx):
        yield
        args = convertRequestToForm(ctx)
        print args
        res = self.model.newItemForm_subItemGrid(int(args['template_node']))
        returnValue(res)
        
        
    @jsonify
    @inlineCallbacks
    def child_newItemForm_subItemCombo(self, ctx):
        yield
        args = convertRequestToForm(ctx)
        print args
        res = self.model.newItemForm_subItemCombo(int(args['template_id']))
        returnValue(res)
        
    @jsonify
    @inlineCallbacks
    def child_newItemForm_submit(self, ctx):
        yield
        args = convertRequestToForm(ctx)
        print args
        template_name = args['template_name']
        data = simplejson.loads(args['jsondata'])
        templates = data['templates']
        properties = data['properties']
        subItems = data['subItems']
        print template_name, templates, properties, subItems
        res = self.model.newItemForm_submit(template_name, templates, properties, subItems)
        returnValue(res)
        

application = service.Application('musicdb site')
webservice = internet.TCPServer(8081, appserver.NevowSite(BasePage(Model())))
webservice.setServiceParent(application)