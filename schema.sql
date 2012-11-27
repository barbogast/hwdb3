DROP SCHEMA items2 CASCADE;

CREATE SCHEMA items2 AUTHORIZATION devel;


CREATE TABLE items.item (
  id                serial,
  name              text,
  is_item_id        int,
  PRIMARY KEY (id),
  FOREIGN KEY (is_item_id) 
    REFERENCES items.item(id),
);
  
CREATE TABLE items.property (
  id      serial,
  name    text,
  unit    text,
  description text,
  PRIMARY KEY (id)
);



CREATE TABLE items.item_contains (
  parent_item_id   int,
  child_item_id    int,
  FOREIGN KEY (parent_item_id) 
    REFERENCES items.item(id),
  FOREIGN KEY (child_item_id) 
    REFERENCES items.item(id),
  UNIQUE (parent_item_id, child_item_id)
);

CREATE TABLE items.item_property (
  property_id int,
  item_id int,
  property_value float,
  FOREIGN KEY (property_id)
    REFERENCES items.property(id),
  FOREIGN KEY (item_id)
    REFERENCES items.item(id),
  UNIQUE (property_id, item_id)
);

-- suggestions, which items an item could contain
CREATE TABLE items.item_contains_suggestion (
  parent_item_id   int,
  child_item_id    int,
  FOREIGN KEY (parent_item_id) 
    REFERENCES items.item(id),
  FOREIGN KEY (child_item_id) 
    REFERENCES items.item(id),
  UNIQUE (parent_item_id, child_item_id)
);

-- suggestions, which properties an item could have
CREATE TABLE items.item_property_suggestion (
  property_id int,
  item_id int,
  FOREIGN KEY (property_id)
    REFERENCES items.property(id),
  FOREIGN KEY (item_id)
    REFERENCES items.item(id),
  UNIQUE (property_id, item_id)
);


CREATE TABLE items.standard (
  id       serial,
  name     text,
  description  text,
  PRIMARY KEY (id)
);


CREATE TABLE items.item_standard (
  item_id          int,
  standard_id          int,
  FOREIGN KEY (item_id)
    REFERENCES items.item(id),
  FOREIGN KEY (standard_id)
    REFERENCES items.standard(id)
);


set search_path to items;
INSERT INTO template (id, name) values (1, 'Grafikkarte');
INSERT INTO template (id, name) values (2, 'Bus-Anschluss');
INSERT INTO template (id, name) values (3, 'Strom-Anschluss');
INSERT INTO template (id, name) values (4, 'Anschluss');
INSERT INTO template (id, name) values (5, 'Grafikprozessor');
INSERT INTO template (id, name) values (6, 'Prozessor');
INSERT INTO template (id, name) values (7, 'RAM');
INSERT INTO template (id, name) values (8, 'GDDR5');
INSERT INTO template (id, name) values (9, 'Laptop');
INSERT INTO template_contains (parent_template_id, child_template_id) values (1, 2);
INSERT INTO template_contains (parent_template_id, child_template_id) values (1, 3);
INSERT INTO template_contains (parent_template_id, child_template_id) values (1, 5);
INSERT INTO template_contains (parent_template_id, child_template_id) values (1, 7);
INSERT INTO template_contains (parent_template_id, child_template_id) values (9, 1);
insert into template_belongs_to (parent_template_id, child_template_id) values (4, 2);
insert into template_belongs_to (parent_template_id, child_template_id) values (4, 3);
insert into template_belongs_to (parent_template_id, child_template_id) values (6, 5);
insert into template_belongs_to (parent_template_id, child_template_id) values (7, 8);

INSERT INTO property (id, name, unit) values (1, 'Stromverbrauch', 'Watt');
INSERT INTO property (id, name, unit) values (2, 'Frequency', 'MHz');
insert into property (id, name, unit) values (3, 'Busbreite', 'Bit');
insert into property (id, name, unit) values (4, 'Capacity', 'Byte');
INSERT INTO template_property (id, template_id, property_id) values (1, 1, 1);
INSERT INTO template_property (id, template_id, property_id) values (2, 5, 2);
INSERT INTO template_property (id, template_id, property_id) values (3, 8, 2);
INSERT INTO template_property (id, template_id, property_id) values (4, 8, 3);
INSERT INTO template_property (id, template_id, property_id) values (5, 8, 4);



INSERT INTO item (id, name, template_id) values (1, 'SAPPHIRE Radeon HD 6950', 1); -- http://www.alternate.de/html/product/Grafikkarte/SAPPHIRE/Radeon_HD_6950/789438/?baseId=689356
INSERT INTO item (id, name, template_id) values (2, 'PCIe 2.0', 2);
INSERT INTO item (id, name, template_id) values (3, '2x6-pin Grafikkartenanschluss', 3);
INSERT INTO item (id, name, template_id) values (4, 'AMD Radeon HD 6950', 5);
INSERT INTO item (id, name, template_id) values (5, 'No Name [GDDR5]', 8);
INSERT INTO item_contains (parent_item_id, child_item_id) values (1, 2);
INSERT INTO item_contains (parent_item_id, child_item_id) values (1, 3);
INSERT INTO item_contains (parent_item_id, child_item_id) values (1, 4);
INSERT INTO item_contains (parent_item_id, child_item_id) values (1, 5);
insert into item_property (template_property_id, item_id, property_value) values (1, 1, 200);
insert into item_property (template_property_id, item_id, property_value) values (2, 4, 800);
insert into item_property (template_property_id, item_id, property_value) values (3, 5, 5000);
insert into item_property (template_property_id, item_id, property_value) values (5, 5, 2048);
insert into item_property (template_property_id, item_id, property_value) values (4, 5, 256);

insert into standard (id, name) values (1, 'DirectX 11');
insert into standard (id, name) values (2, 'OpenGL 4.1');

insert into item_standard (item_id, standard_id) values (4, 1);
insert into item_standard (item_id, standard_id) values (4, 2);

select t2.name || ' contains ' || t1.name 
    from template t1, template t2, template_contains tc 
    where t1.id = tc.child_template_id and 
          t2.id = tc.parent_template_id;
          
select t1.name || ' belongs to ' || t2.name 
    from template t1, template t2, template_belongs_to tbt 
    where t1.id = tbt.child_template_id and 
          t2.id = tbt.parent_template_id;

select i1.name || ' contains ' || i2.name || ' as ' || t.name 
    from item i1, item i2, item_contains ic, template t 
    where ic.parent_item_id = i1.id and 
          ic.child_item_id = i2.id and 
          i2.template_id = t.id;

select i.name || ' [' || t.name || '] has ' || p.name || ': ' || ip.property_value
    from item i, property p, item_property ip, template t, template_property tp 
    where i.id = ip.item_id and 
          ip.template_property_id = tp.id and 
          tp.template_id = t.id and
          tp.property_id = p.id;

select i.name || ' supports ' || s.name
    from item i, standard s, item_standard its
    where i.id = its.item_id and
          s.id = its.standard_id;

