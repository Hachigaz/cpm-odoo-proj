from odoo import models, fields, api

class Equipment(models.Model):
    _name = 'cpm_odoo.res_mgmt_equipment'
    _description = "Equipment"
    
    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    eqp_type_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_eqp_type', 
        string='Equipment Type',
        ondelete= 'restrict',
        required=True
    )
    
    supplier_ids = fields.Many2many(
        comodel_name="cpm_odoo.stakeholders_supplier",
        string='supplier_ids'
    )
    
class EquipmentType(models.Model):
    _name = 'cpm_odoo.res_mgmt_eqp_type'
    _description = "Equipment Type"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    color = fields.Char(
        string = 'Category Color',
        required=True,
        size=24,
        default = "#FF5733"
    )
    
class Material(models.Model):
    _name = 'cpm_odoo.res_mgmt_material'
    _description = "Material"
    
    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    mat_type_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_mat_type', 
        string='Material Type',
        ondelete= 'restrict',
        required=True
    )
    
    supplier_ids = fields.Many2many(
        comodel_name="cpm_odoo.stakeholders_supplier",
        string='supplier_ids'
    )
    
class MaterialType(models.Model):
    _name = 'cpm_odoo.res_mgmt_mat_type'
    _description = "Material Type"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'Description'
    )
    
    color = fields.Char(
        string = 'Category Color',
        required=True,
        size=24,
        default = "#FF5733"
    )

class Mat_Res_Record(models.AbstractModel):
    _name = 'cpm_odoo.res_mgmt_mat_res_rec'
    _description = "Material Record"
    
    material_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_material', 
        string='Material',
        required=True,
        ondelete='restrict'
    )
    
    amount = fields.Float(
        string = 'Amount',
        default = 0.0
    )
    
class Eqp_Res_Record(models.AbstractModel):
    _name = 'cpm_odoo.res_mgmt_eqp_res_rec'
    _description = "Model"
    
    equipment_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_equipment', 
        string='Equipment',
        required=True,
        ondelete='restrict'
    )
    
    amount = fields.Integer(
        string = 'Amount',
        default = 0
    )
    
    
    
class WarehouseInfo(models.Model):
    _name = 'cpm_odoo.res_mgmt_warehouse_info'
    _description = 'model.technical.name'
    
    name  = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    address  = fields.Char(
        string = 'Address',
        size = 1024
    )
    
    assigned_manager_ids = fields.Many2many(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='assigned_manager'
    )
    
    mat_storage_rec_ids = fields.One2many(
        comodel_name = 'cpm_odoo.res_mgmt_mat_storage_rec', 
        inverse_name = 'warehouse_id', 
        string='mat_storage_rec'
    )
    
    eqp_storage_rec_ids = fields.One2many(
        comodel_name = 'cpm_odoo.res_mgmt_eqp_storage_rec', 
        inverse_name = 'warehouse_id', 
        string='eqp_storage_rec'
    )
    
    mat_imp_rec_ids = fields.One2many(
        'cpm_odoo.logistics_mat_imp_rec', 'warehouse_id', string='mat_imp_rec'
    )
    
    eqp_imp_rec_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_imp_rec', 'warehouse_id', string='eqp_imp_rec'
    )
    
    mat_exp_rec_ids = fields.One2many(
        'cpm_odoo.logistics_mat_exp_rec', 'warehouse_id', string='mat_exp_rec'
    )
    
    eqp_exp_rec_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_exp_rec', 'warehouse_id', string='eqp_exp_rec'
    )
    
class Mat_StorageRecord(models.Model):
    _name = 'cpm_odoo.res_mgmt_mat_storage_rec'
    _description = "Model"
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    _inherit = ['cpm_odoo.res_mgmt_mat_res_rec']

    
class Eqp_StorageRecord(models.Model):
    _name = 'cpm_odoo.res_mgmt_eqp_storage_rec'
    _description = "Model"
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    _inherit = ['cpm_odoo.res_mgmt_eqp_res_rec']