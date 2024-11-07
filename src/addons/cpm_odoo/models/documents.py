from odoo import models,fields,api

class DocumentSet(models.Model):
    _name = "cpm_odoo.documents_document_set"
    _description = "Document Set"
    
    name = fields.Char(
        string = 'Name',
        required=True,
        size = 256
    )
    
    description = fields.Text(
        string = 'description'
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
    
    updated_at = fields.Datetime(
        compute='_compute_updated_at', 
        string='updated_at',
        store=True
    )
    
    @api.depends('document_ids.date_uploaded')
    def _compute_updated_at(self):
        
        for record in self:
            return_date = False
            for doc in record.document_ids:
                if return_date < doc.date_uploaded:
                    return_date=doc.date_uploaded
            record.updated_at = return_date
        pass
    
    document_count = fields.Integer(
        compute='_compute_document_count', 
        string='document_count',
        store=True
    )
    
    @api.depends('document_ids.date_uploaded')
    def _compute_document_count(self):
        
        for record in self:
            record.document_count = len(record.document_ids)
        pass
    
class Document(models.Model):
    _name = "cpm_odoo.documents_document"
    _description = "Document"
    
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
        default = fields.Datetime.now()
    )
    
    uploaded_by = fields.Many2one(
        comodel_name = 'cpm_odoo.human_res_staff', 
        string='Uploaded By'
    )
    
    category_id = fields.Many2one(
        comodel_name = 'cpm_odoo.documents_document_category', 
        string='Category',
        ondelete='restrict'
    )
    
class DocumentCategory(models.Model):
    _name = "cpm_odoo.documents_document_category"
    _description = "Document Category"
    
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
    
    display = fields.Boolean(
        string = 'Display',
        required=True,
        default=False
    )