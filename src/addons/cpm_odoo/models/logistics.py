from odoo import models, fields, api
from odoo.exceptions import ValidationError
import json

class Abs_ImportRecord(models.AbstractModel):
    _name = 'cpm_odoo.logistics_abs_imp_rec'
    _description = 'model.technical.name'
    
    title = fields.Char(
        string = 'Title',
        required=True,
        size = 256,
        default="Import Record"
    )
        
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )
    
    supplier_id = fields.Many2one(
        comodel_name = 'cpm_odoo.stakeholders_supplier', 
        string='supplier'
    )

    date_created = fields.Datetime(
        string = 'Date Created',
        default = fields.Datetime.now(),
        required = True
    )
    
    created_by = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string = 'Created By'
    )
    
    @api.model_create_multi
    def create(self, vals):
        for val in vals:
            staff = self.env["cpm_odoo.human_res_staff"].search([('user_id', '=', self.env.user.id)], limit=1)
            if(len(staff)>0):
                val["created_by"] = staff.id
        return super().create(vals)

class Mat_ImportRecord(models.Model):
    _name = 'cpm_odoo.logistics_mat_imp_rec'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.logistics_abs_imp_rec']
    
    imp_det_ids = fields.One2many(
        'cpm_odoo.logistics_mat_imp_rec_det', 
        'imp_rec_id', 
        string='imp_det'
    )
    
    @api.onchange('supplier_id')
    def _onchange_supplier_id(self):
        for record in self.imp_det_ids:
            record.unlink()
        self.write({
            'imp_det_ids':[(5,0,0)]
        })
        pass
    
    # @api.model_create_multi
    # def create(self, vals):
    #     recs = super().create(vals)
        
    #     for rec in recs:
    #         rec.warehouse_id.write({
    #             'mat_imp_rec_ids':[(4,rec.id)]
    #         })
        
    #     return recs
    
    @api.constrains('imp_det_ids')
    def _constrains_imp_det_ids(self):
        dets = self.imp_det_ids
        overlap_recs = []
        for i in range(len(self.imp_det_ids)):
            for j in range(i,len(self.imp_det_ids)):
                if dets[i].material_id.id == dets[j].material_id.id and i != j:
                    overlap_recs.append(dets[i])
        if len(overlap_recs)>0:
            rec = overlap_recs[0]
            raise ValidationError(f"{rec.material_id.name} has duplicate records")
    
    is_verified = fields.Boolean(
        string = 'is_verified',
        required = True,
        default = False
    )
    
    verified_at = fields.Datetime(
        'verified_at'
    )
    
    def act_verify_record(self):
        for record in self:
            if record.is_verified:
                raise ValidationError("Cannot verify import record that is already verified.")
            else:
                record.is_verified = True
                record.verified_at = fields.Datetime.now()
                for imp_det in record.imp_det_ids:
                    s_rec = [s_rec for s_rec in self.warehouse_id.mat_storage_rec_ids if s_rec.material_id == imp_det.material_id]
                    if len(s_rec)==1:
                        s_rec = s_rec[0]
                        s_rec.amount += imp_det.amount
                    else:
                        self.warehouse_id.write({
                            'mat_storage_rec_ids':[(0,0,{
                                'material_id':imp_det.material_id.id,
                                'amount':imp_det.amount
                            })]
                        })
                        
    def write(self, vals):
        for record in self:
            if record.is_verified:
                raise ValidationError("Cannot edit verified import record.")
        return super().write(vals)
    
    @api.model_create_multi
    def create(self, vals):
        recs = super().create(vals)
        
        
        return recs
    
class Mat_ImportRecordDetail(models.Model):
    _name = 'cpm_odoo.logistics_mat_imp_rec_det'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.res_mgmt_mat_res_rec']
    
    imp_rec_id = fields.Many2one(
        'cpm_odoo.logistics_mat_imp_rec', 
        string='imp_rec',
        required=True,
        ondelete='cascade'
    )
    
    @api.constrains('amount')
    def _constrains_amount(self):
        for rec in self:
            if rec.amount == 0:
                raise ValidationError("Amount must be larger than 0")
        pass
    
    @api.constrains('material_id')
    def _constrains_material_id(self):
        for record in self:
            supplier_rec = record.imp_rec_id.supplier_id
            if not any(record.material_id.id  == rec.id for rec in supplier_rec.supplied_mat_ids):
                raise ValidationError(f"The supplier {supplier_rec.name} does not supply the material {record.material_id.name}")
        pass
    
class Eqp_ImportRecord(models.Model):
    _name = 'cpm_odoo.logistics_eqp_imp_rec'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.logistics_abs_imp_rec']
    
    imp_det_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_imp_rec_det', 
        'imp_rec_id', 
        string='imp_det'
    )
    
    @api.onchange('supplier_id')
    def _onchange_supplier_id(self):
        for record in self.imp_det_ids:
            record.unlink()
        self.write({
            'imp_det_ids':[(5,0,0)]
        })
        pass
    
    # @api.model_create_multi
    # def create(self, vals):
    #     recs = super().create(vals)
        
    #     for rec in recs:
    #         rec.warehouse_id.write({
    #             'eqp_imp_rec_ids':[(4,rec.id)]
    #         })
        
    #     return recs
    
    @api.constrains('imp_det_ids')
    def _constrains_imp_det_ids(self):
        dets = self.imp_det_ids
        overlap_recs = []
        for i in range(len(self.imp_det_ids)):
            for j in range(i,len(self.imp_det_ids)):
                if dets[i].equipment_id.id == dets[j].equipment_id.id and i != j:
                    overlap_recs.append(dets[i])
        if len(overlap_recs)>0:
            rec = overlap_recs[0]
            raise ValidationError(f"{rec.equipment_id.name} has duplicate records")
    
    is_verified = fields.Boolean(
        string = 'is_verified',
        required = True,
        default = False
    )
    
    verified_at = fields.Datetime(
        'verified_at'
    )
    
    def act_verify_record(self):
        for record in self:
            if record.is_verified:
                raise ValidationError("Cannot verify import record that is already verified.")
            else:
                record.is_verified = True
                record.verified_at = fields.Datetime.now()
                for imp_det in record.imp_det_ids:
                    s_rec = [s_rec for s_rec in self.warehouse_id.eqp_storage_rec_ids if s_rec.equipment_id == imp_det.equipment_id]
                    if len(s_rec)==1:
                        s_rec = s_rec[0]
                        s_rec.amount += imp_det.amount
                    else:
                        self.warehouse_id.write({
                            'eqp_storage_rec_ids':[(0,0,{
                                'equipment_id':imp_det.equipment_id.id,
                                'amount':imp_det.amount
                            })]
                        })
                        
    def write(self, vals):
        for record in self:
            if record.is_verified:
                raise ValidationError("Cannot edit verified import record.")
        return super().write(vals)
    
    @api.model_create_multi
    def create(self, vals):
        recs = super().create(vals)
        
        
        return recs
    
class Eqp_ImportRecordDetail(models.Model):
    _name = 'cpm_odoo.logistics_eqp_imp_rec_det'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.res_mgmt_eqp_res_rec']
    
    imp_rec_id = fields.Many2one(
        'cpm_odoo.logistics_eqp_imp_rec', 
        string='imp_rec',
        required=True,
        ondelete='cascade'
    )
    
    @api.constrains('amount')
    def _constrains_amount(self):
        for rec in self:
            if rec.amount == 0:
                raise ValidationError("Amount must be larger than 0")
        pass
    
    @api.constrains('equipment_id')
    def _constrains_equipment_id(self):
        for record in self:
            supplier_rec = record.imp_rec_id.supplier_id
            if not any(record.equipment_id.id  == rec.id for rec in supplier_rec.supplied_eqp_ids):
                raise ValidationError(f"The supplier {supplier_rec.name} does not supply the equipment {record.equipment_id.name}")
        pass
    
class Abs_ExportRecord(models.AbstractModel):
    _name = 'cpm_odoo.logistics_abs_exp_rec'
    _description = 'model.technical.name'
    
    title = fields.Char(
        string = 'Title',
        required=True,
        size = 256,
        default="Export Record"
    )
    
    export_type = fields.Selection(
        [
            ('site_delivery', 'Site Delivery'),
            ('warehouse_transfer', 'Warehouse Transfer') 
        ], 
        string='export_type',
        default="site_delivery"
    )
    
    warehouse_id = fields.Many2one(
        comodel_name = 'cpm_odoo.res_mgmt_warehouse_info', 
        string='Warehouse'
    )

    date_created = fields.Datetime(
        string = 'Date Created',
        default = fields.Datetime.now(),
        required = True
    )
    
    created_by = fields.Many2one(
        comodel_name ='cpm_odoo.human_res_staff', 
        string = 'Created By'
    )
    
    @api.model_create_multi
    def create(self, vals):
        for val in vals:
            staff = self.env["cpm_odoo.human_res_staff"].search([('user_id', '=', self.env.user.id)], limit=1)
            if(len(staff)>0):
                val["created_by"] = staff.id
        return super().create(vals)
    
    delivered_by = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='delivered_by',
        required=True
    )
    
    is_delivered = fields.Boolean(
        string = 'is_delivered',
        default=False,
        required=True
    )

    delivered_at = fields.Datetime(
        string = 'delivered_at'
    )
    
    def act_mark_delivered(self):
        for record in self:
            record.is_delivered = True
            record.delivered_at = fields.Datetime.now()
            
            
    is_verified = fields.Boolean(
        string = 'is_verified',
        required = True,
        default = False
    )
    
    date_verified = fields.Datetime('date_verified')


class Mat_ExportRecord(models.Model):
    _name = 'cpm_odoo.logistics_mat_exp_rec'
    _description = 'model.technical.name'
    
    _inherit = ["cpm_odoo.logistics_abs_exp_rec"]
    
    exp_det_ids = fields.One2many(
        'cpm_odoo.logistics_mat_exp_rec_det', 
        'exp_rec_id', 
        string='exp_det'
    )
    
    trans_exp_det_ids = fields.One2many(
        'cpm_odoo.logistics_mat_exp_rec_det_transient', 
        'exp_rec_id', 
        string='trans_exp_det'
    )
    
    @api.constrains('exp_det_ids')
    def _constrains_exp_det_ids(self):
        dets = self.exp_det_ids
        overlap_recs = []
        for i in range(len(self.exp_det_ids)):
            for j in range(i,len(self.exp_det_ids)):
                if dets[i].material_id.id == dets[j].material_id.id and i != j:
                    overlap_recs.append(dets[i])
        if len(overlap_recs)>0:
            rec = overlap_recs[0]
            raise ValidationError(f"{rec.material_id.name} has duplicate records")
        
    
    def act_verify_record(self):
        for record in self:
            if record.is_verified:
                raise ValidationError("Cannot verify export record that is already verified.")
            else:
                record.is_verified = True
                record.date_verified = fields.Datetime.now()
                for exp_det in record.exp_det_ids:
                    s_rec = [s_rec for s_rec in self.warehouse_id.mat_storage_rec_ids if s_rec.material_id == exp_det.material_id]
                    if len(s_rec)==1:
                        s_rec = s_rec[0]
                        if s_rec.amount < exp_det.amount:
                            raise ValidationError(f"Cannot verified export record, there is not enough {s_rec.material_id.name} in stock ({s_rec.amount} remaining).")

                        s_rec.amount -= exp_det.amount
                    elif len(s_rec)>1:
                        raise ValidationError("Unexpected Error - 222")
                    else:
                        raise ValidationError(f"Cannot verified export record, there is no {exp_det.material_id.name} in stock.")

    # @api.model_create_multi
    # def create(self, vals):
    #     recs = super().create(vals)
        
    #     for rec in recs:
    #         rec.warehouse_id.write({
    #             'mat_exp_rec_ids':[(4,rec.id)]
    #         })
        
    #     return recs

class Mat_ExportRecordDetail(models.Model):
    _name = 'cpm_odoo.logistics_mat_exp_rec_det'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.res_mgmt_mat_res_rec']
    
    exp_rec_id = fields.Many2one(
        'cpm_odoo.logistics_mat_exp_rec', 
        string='exp_rec',
        required=True,
        ondelete='cascade'
    )
    
    @api.constrains('amount')
    def _constrains_amount(self):
        for det_rec in self:
            if det_rec.amount <= 0:
                raise ValidationError("Amount must be larger than 0")
            
            storage_rec = [rec for rec in det_rec.exp_rec_id.warehouse_id.mat_storage_rec_ids if rec.material_id == det_rec.material_id]
            
            if len(storage_rec) == 0:
                raise ValidationError(f"There is no {det_rec.material_id.name} in stock")
            else:  
                storage_rec = storage_rec[0]          
                if storage_rec.amount <det_rec.amount:
                    raise ValidationError(f"Not enough {det_rec.material_id.name} in stock ({storage_rec.amount} available)")
                
        pass
    
class Mat_ExportRecordDetail_Transient(models.TransientModel):
    _name = 'cpm_odoo.logistics_mat_exp_rec_det_transient'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.logistics_mat_exp_rec_det']
    
class Eqp_ExportRecord(models.Model):
    _name = 'cpm_odoo.logistics_eqp_exp_rec'
    _description = 'model.technical.name'
    
    _inherit = ["cpm_odoo.logistics_abs_exp_rec"]
    
    exp_det_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_exp_rec_det', 
        'exp_rec_id', 
        string='exp_det'
    )
    
    trans_exp_det_ids = fields.One2many(
        'cpm_odoo.logistics_eqp_exp_rec_det_transient', 
        'exp_rec_id', 
        string='trans_exp_det'
    )
    
    # @api.model_create_multi
    # def create(self, vals):
    #     recs = super().create(vals)
        
    #     for rec in recs:
    #         rec.warehouse_id.write({
    #             'eqp_exp_rec_ids':[(4,rec.id)]
    #         })
        
    #     return recs
        
    def act_verify_record(self):
        for record in self:
            if record.is_verified:
                raise ValidationError("Cannot verify export record that is already verified.")
            else:
                record.is_verified = True
                record.date_verified = fields.Datetime.now()
                for exp_det in record.exp_det_ids:
                    s_rec = [s_rec for s_rec in self.warehouse_id.eqp_storage_rec_ids if s_rec.equipment_id == exp_det.equipment_id]
                    if len(s_rec)==1:
                        s_rec = s_rec[0]
                        if s_rec.amount < exp_det.amount:
                            raise ValidationError(f"Cannot verified export record, there is not enough {s_rec.equipment_id.name} in stock ({s_rec.amount} remaining).")

                        s_rec.amount -= exp_det.amount
                    elif len(s_rec)>1:
                        raise ValidationError("Unexpected Error - 222")
                    else:
                        raise ValidationError(f"Cannot verified export record, there is no {exp_det.equipment_id.name} in stock.")
    
    @api.constrains('exp_det_ids')
    def _constrains_exp_det_ids(self):
        dets = self.exp_det_ids
        overlap_recs = []
        for i in range(len(self.exp_det_ids)):
            for j in range(i,len(self.exp_det_ids)):
                if dets[i].equipment_id.id == dets[j].equipment_id.id and i != j:
                    overlap_recs.append(dets[i])
        if len(overlap_recs)>0:
            rec = overlap_recs[0]
            raise ValidationError(f"{rec.equipment_id.name} has duplicate records")
        
    @api.constrains('amount')
    def _constrains_amount(self):
        for record in self:
            storage_rec = self.env["cpm_odoo.res_mgmt_eqp_storage_rec"].search(
                [
                    ['warehouse_id','=',record.imp_rec_id.warehouse_id.id],
                    ['equipment_id','=',record.equipment_id.id]
                ]
            )
            if (not storage_rec) or storage_rec.amount - reocrd.amount < 0:
                raise ValidationError(f"There is not enough equipment {record.equipment_id.name} ({record.storage_rec.amount}) in warehouse {record.imp_rec_id.warehouse_id.name} to export")
        pass
    
class Eqp_ExportRecordDetail(models.Model):
    _name = 'cpm_odoo.logistics_eqp_exp_rec_det'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.res_mgmt_eqp_res_rec']
    
    @api.constrains('amount')
    def _constrains_amount(self):
        for det_rec in self:
            if det_rec.amount <= 0:
                raise ValidationError("Amount must be larger than 0")
            
            storage_rec = [rec for rec in det_rec.exp_rec_id.warehouse_id.eqp_storage_rec_ids if rec.equipment_id == det_rec.equipment_id]
            
            if len(storage_rec) == 0:
                raise ValidationError(f"There is no {det_rec.equipment_id.name} in stock")
            else:  
                storage_rec = storage_rec[0]          
                if storage_rec.amount <det_rec.amount:
                    raise ValidationError(f"Not enough {det_rec.equipment_id.name} in stock ({storage_rec.amount} available)")
                
        pass
    
    exp_rec_id = fields.Many2one(
        'cpm_odoo.logistics_eqp_exp_rec', 
        string='exp_rec',
        required=True,
        ondelete='cascade'
    )
    
class Eqp_ExportRecordDetail_Transient(models.TransientModel):
    _name = 'cpm_odoo.logistics_eqp_exp_rec_det_transient'
    _description = 'model.technical.name'
    
    _inherit = ['cpm_odoo.logistics_eqp_exp_rec_det']