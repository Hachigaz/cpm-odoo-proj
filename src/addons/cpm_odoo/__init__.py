# -*- coding: utf-8 -*-

from . import controllers
from . import models

from odoo.exceptions import ValidationError
import json

def _test(env):
    # recs = env["ir.module.category"].search([])
    # names = [rec.name for rec in recs]
    # raise ValidationError(f"{json.dumps(names)}")
    # raise ValidationError(f"{env.user.id},{env.user.name},{json.dumps([group.name for group in env.user.groups_id])}")
    pass

def _process_install_module(env):
    """
    Post-init hook to add the current user to a specific group.
    """
    group = env.ref('cpm_gr.create_and_edit_projects')
    rec = env["cpm_odoo.human_res_staff"].create({
        "first_name":"Superuser",
        "last_name":"",
        "user_id":1
    })
    
    rec = env["cpm_odoo.human_res_staff"].create({
        "first_name":"Administrator",
        "last_name":"",
        "user_id":2
    })
    
    env.user.write({
        'groups_id':[(4,group.id)]
    })
    
    cur_user = env["cpm_odoo.human_res_staff"].browse(2)
    cur_user.write({
        'groups_id':[(4,group.id)]
    })