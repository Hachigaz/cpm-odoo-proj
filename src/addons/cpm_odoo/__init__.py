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
    env.user.write({
        'groups_id':[(4,group.id)]
    })