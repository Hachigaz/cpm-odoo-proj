/** @odoo-module **/
import { useService } from "@web/core/utils/hooks";
import { storePageContext,getPageContext,moveToPage,storePageInfo,getPageInfo, formatDate, formatDateTime, clearPageInfo} from "../components/component_utils";
import { registry } from "@web/core/registry"
import { Component, onWillStart, onMounted, onWillUnmount, onWillDestroy, useEffect, useState, useRef} from "@odoo/owl";
import { ItemList, ListFilter, SearchBar } from "../components/components";


export class ContractSetCard extends Component{
    static template = "cpm_odoo.ContractSetCard"
    
    setup(){
        this.action=useService("action")
    }

    async act_contract_set_detail(contract_set_id){
        await this.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.contract_set_detail',
            context: {contract_set_id:contract_set_id}
        });
    }
}

class ContractSetDetailContractList extends ItemList{
    static template = "cpm_odoo.ContractSetDetailContractList"
    static formatDateTime = formatDateTime
    setup(){
        super.init()

        this.page_data.model_name = "cpm_odoo.contracts_contract"
        this.page_data.column_list = ['file_name','uploaded_by','date_uploaded','file_size','id','contract_set_id']//columns to get from model
        this.page_data.order_by_str = "date_uploaded desc"
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])
        this.state_info = useState({
            can_delete : true
        })

        this.action = useService("action")
        
        super.setup()
    }

    async act_download_doc(doc){
        if(!confirm(`Download ${doc.file_name?doc.file_name:'contract'}?`)){
            return
        }
        
        let result = await this.orm.call(
            'cpm_odoo.contracts_contract',
            'act_download_file',
            [
                doc.id
            ]
        )
        this.action.doAction(
            result
        )
    }

    async act_delete_doc(doc){
        if(!confirm(`Delete ${doc.file_name?doc.file_name:'contract'}?`)){
            return
        }


        this.orm.call(
            "cpm_odoo.contracts_contract",
            "unlink",
            [
                doc.id
            ]
        )
        window.location.reload()
    }
}

class ContractSetDetailPage extends Component{
    static template = "cpm_odoo.ContractSetDetailPage"
    
    static components = {
        ContractSetDetailContractList
    }
    static clientActionName = "cpm_odoo.contract_set_detail"

    setup(){
        if(Object.keys(this.props.action.context).length !== 0){
            let context = this.props.action.context
            sessionStorage.setItem("page_context",JSON.stringify({
                action_name:this.clientActionName,
                context:context
            }))
        }
        this.context = JSON.parse(sessionStorage.getItem("page_context"))
        if(this.context && this.context.action_name === this.clientActionName){
            this.context = this.context.context
            this.extra_domain = [['contract_set_id','=',this.context.contract_set_id]]
        }
        else{
            window.history.back()
        }
        this.state_info= useState({
            doc_set_info:{}
        })
        this.action=useService('action')
        this.orm=useService('orm')

        this.loadData()
    }

    async loadData(){
        this.state_info.doc_set_info = (await this.orm.call(
            "cpm_odoo.contracts_contract_set",
            "read",
            [
                this.context.contract_set_id
            ]
        ))[0]
    }

    async act_add_doc_to_set(){
        let result = await this.orm.call(
            'cpm_odoo.contracts_contract_set',
            'act_add_doc_to_set',
            [
                this.context.contract_set_id
            ]
        )
        this.action.doAction(
            result
        )
    }

    async act_edit_doc_set_info(){
        this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Contract Set - Info',
            res_model: 'cpm_odoo.contracts_contract_set',  // Replace with the model name, e.g., 'res.partner'
            res_id: this.context.contract_set_id,  // ID of the record you want to edit
            views: [[false, 'form']],  // Open the form view for editing
            target: 'new',  // Open in a new window, you can also use 'current' to open in the same window
            context:{
                action_name:"Edit Info"
            }
        })
    }

    async act_delete_doc_set(doc){
        if(!confirm(`Delete contract set?`)){
            return
        }


        result = await this.orm.call(
            "cpm_odoo.contracts_contract_set",
            "unlink",
            [
                this.context.contract_set_id
            ]
        )
        if(result){
            window.history.back()
        }
    }
}

registry.category("actions").add(ContractSetDetailPage.clientActionName, ContractSetDetailPage);


export class ContractSetItemList extends ItemList{
    static template = "cpm_odoo.ContractSetItemList"
    static components = {
        SearchBar,
        ContractSetCard,
        ListFilter
    }
    

    setup(){
        super.init()

        this.page_data.model_name = "cpm_odoo.contracts_contract_set"
        this.page_data.column_list = []
        this.page_data.order_by_str = "document_count, updated_at desc, name asc"
        this.page_data.join_cols = [
            ['contractor_id','cpm_odoo.stakeholders_contractor']
        ]

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])
        
        this.filter_data = [
            {
                col_name:"contractor_id",
                item_list:[]
            }
        ]

        onWillStart(async ()=>{
            await this.loadData()
        })

        super.setup()
    }

    async loadData(){
        await this.loadFilterData()
    }

    async loadFilterData(){
        this.filter_data[0].item_list = await this.orm.call(
            "cpm_odoo.stakeholders_contractor",
            "search_read",
            [
                [

                ],
                [
                    "id","name"
                ],
                0,0,
                "name asc"
            ]
        )
    }
}

class ContractSetListPage extends Component{
    static template = "cpm_odoo.ContractSetListPage"
    static components = {
        ContractSetItemList
    }
    
    static clientActionName = "cpm_odoo.contract_set_item_list"

    setup(){
        if(Object.keys(this.props.action.context).length !== 0){
            let context = this.props.action.context
            sessionStorage.setItem("page_context",JSON.stringify({
                action_name:this.clientActionName,
                context:context
            }))
        }
        this.context = JSON.parse(sessionStorage.getItem("page_context"))
        if(this.context && this.context.action_name === this.clientActionName){
            this.context=this.context.context
            if(this.context.category_id){
                this.extra_domain = [["contractor_id","=",this.context.category_id]]
            }
        }
        else{
            window.history.back()
        }
    }
}

registry.category("actions").add(ContractSetListPage.clientActionName, ContractSetListPage);



class ProjectContractTab extends Component{
    static page_name='cpm_odoo.ProjectContractTab'
    static template="cpm_odoo.ProjectContractTab"

    static components={
        ContractSetItemList
    }

    setup(){
        this.action = useService("action")
        this.orm = useService("orm")
    }

    async act_create_document(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Create Contract Set',
            res_model: 'cpm_odoo.contracts_contract_set',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 
                'project_id':this.props.context_data.project_id,
                'default_is_project_specicic':false
            },  // Optional: default values for fields
        });
    }
}

class GeneralContractTab extends Component{
    static page_name='cpm_odoo.GeneralContractTab'
    static template="cpm_odoo.GeneralContractTab"

    static components={
        ContractSetItemList
    }

    setup(){
        this.action = useService("action")
        this.orm = useService("orm")
    }

    async act_create_document(){
        await this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Create Contract Set',
            res_model: 'cpm_odoo.contracts_contract_set',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 
                'project_id':this.props.context_data.project_id,
                'default_is_project_specicic':false
            },  // Optional: default values for fields
        });
    }
}

export class ContractManagementTab extends Component{
    static page_name='cpm_odoo.ContractManagementTab'
    static template="cpm_odoo.ContractManagementTab"
    static components = {
        ProjectContractTab,
        GeneralContractTab
    };
    get pageComponent() {
        const renderPage = this.constructor.availablePages.find(page => page.id === this.currentPage);
        return renderPage.page
    }

    static availablePages = [
        {
            id:ProjectContractTab.page_name,
            name:"Project Contracts",
            page:ProjectContractTab,
            group_id:""
        },
        {
            id:GeneralContractTab.page_name,
            name:"General Contracts",
            page:GeneralContractTab,
            group_id:""
        }
    ]

    setup(){
        this.currentPage = getPageContext().subpage_id;
        if (this.currentPage == null){
            this.currentPage=this.constructor.availablePages[0].id
        }
        
    }


    async callSubPage(id) {
        moveToPage(false,id)
    }
}