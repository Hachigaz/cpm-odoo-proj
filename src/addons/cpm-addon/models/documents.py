from odoo import models,fields,api

class DocumentSet(models.Model):
    _name = "cpm_odoo.documents_document_set"
    _description = ""
    
    project_doc_mgmt_id = fields.Many2one(
        'cpm_odoo.root_project_res_mgmt', 
        string='project_doc_mgmt',
        readonly=True,
        required = True
    )
    
    name = fields.Char(
        String = 'Name',
        required=True,
        size = 256
    )
    
    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.documents_document_category', 
        string='Category',
        ondelete = "restrict"
    )
    
    document_ids = fields.One2many(
        comodel_name = 'cpm_odoo.documents_document', 
        inverse_name = 'document_set_id', 
        string='Documents'
    )
    
class Document(models.Model):
    _name = "cpm_odoo.documents_document"
    _description = ""
    
    document_set_id = fields.Many2one(
        comodel_name = 'cpm_odoo.documents_document_set', 
        string='document_set',
        required=True,
        ondelete = "cascade"
    )
    
    file = fields.Binary(
        string = 'File',
        required = True
    )
    
    date_uploaded = fields.Datetime(
        string = 'Date Uploaded',
        readonly=True,
        default = fields.Datetime.now()
    )
    
class DocumentCategory(models.Model):
    _name = "cpm_odoo.documents_document_category"
    _description = ""
    
    name = fields.Char(
        String = 'Name',
        required=True,
        size = 256
    )