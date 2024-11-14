/** @odoo-module **/ 
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { ItemList, SearchBar } from "../components/components";
import { formatDateTime } from "../components/component_utils"

export class StaffDisplayCard extends Component{
    static template = "cpm_odoo.StaffDisplayCard"

    setup(){
        this.action=useService("action")
    }
}