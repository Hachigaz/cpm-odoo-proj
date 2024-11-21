/** @odoo-module **/
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, clearPageInfo} from "../components/component_utils";
import { registry } from "@web/core/registry"
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";
import { WarehouseInfoUI } from "./warehouse_info_ui/warehouse_info_ui";
import { WarehouseImportsUI } from "./warehouse_imports_ui/warehouse_imports_ui";
import { WarehouseExportsUI } from "./warehouse_exports_ui/warehouse_exports_ui";

class WarehouseManageUI extends Component{
    static clientActionName = "cpm_odoo.res_mgmt_manage_warehouse_act"
    static template="cpm_odoo.WarehouseManageUI"

    static components = {
        WarehouseInfoUI
    };

    get pageComponent() {
        const renderPage = this.availablePages.find(page => page.id === this.currentPage);
        return renderPage.page
    }

    availablePages = [
        {
            id:WarehouseInfoUI.page_name,
            name:"Warehouse Stock",
            page:WarehouseInfoUI,
            group_id:""
        },
        {
            id:WarehouseImportsUI.page_name,
            name:"Imports",
            page:WarehouseImportsUI,
            group_id:""
        },
        {
            id:WarehouseExportsUI.page_name,
            name:"Exports",
            page:WarehouseExportsUI,
            group_id:""
        }
    ]

    setup(){
        let ctx_id = sessionStorage.getItem('warehouse_id')
        let new_ctx_id = this.props.action.context.warehouse_id
        if(new_ctx_id!== undefined){
            sessionStorage.setItem('warehouse_id',this.props.action.context.warehouse_id)
            ctx_id = new_ctx_id
        }

        if(!ctx_id){
            window.location.href='/web'
        }
        this.warehouse_id = ctx_id

        if(getPageContext().client_action === this.constructor.clientActionName){
            this.currentPage = getPageContext().page_id;
        }
        else{
            this.currentPage = this.availablePages[0].id
            storePageContext({
                page_id: this.currentPage,
                subpage_id:null,
                client_action : this.constructor.clientActionName
            })
        }
        this.orm = useService('orm')
        
        onWillStart(async ()=>{
            await this.loadData()

            this.props.context_data = {
                warehouse_id: parseInt(sessionStorage.getItem('warehouse_id')),
                client_action: this.clientActionName,
                warehouse_info:this.warehouseInfo
            }
        })

        onMounted(()=>{
            let el_btn = document.querySelector(`#main-side-menu #${this.currentPage}`)
            if(el_btn){
                el_btn.classList.toggle("active")
            }
        })
    }

    async loadData(){
        this.warehouseInfo = (await (this.orm.call(
            "cpm_odoo.res_mgmt_warehouse_info",
            "search_read",
            [
                [
                    ["id",'=',this.warehouse_id]
                ],
                [],
                0,1,""
            ]
        )))[0]
    }

    async callPage(id) {
        moveToPage(id,null)
    }
}

registry.category("actions").add(WarehouseManageUI.clientActionName, WarehouseManageUI);