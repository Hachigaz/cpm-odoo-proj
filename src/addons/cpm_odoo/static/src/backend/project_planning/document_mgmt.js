/** @odoo-module **/ 
import { Component, onWillStart, onMounted, useEffect, useState, useRef} from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { registry } from "@web/core/registry";
import { ItemList, SearchBar } from "../components";
import { formatDateTime } from "../component_utils"

export class DocumentCategoryCard extends Component{
    static template = "cpm_odoo.DocumentCategoryCard"

    setup(){
        this.action=useService("action")
    }

    async act_show_more_document_sets(context_data){
        await this.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.document_set_item_list',
            context: context_data
        });
    }
}

export class DocumentSetCard extends Component{
    static template = "cpm_odoo.DocumentSetCard"
    

    setup(){
        this.action=useService("action")
    }

    async act_document_set_detail(document_set_id){
        await this.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.document_set_detail',
            context: {document_set_id:document_set_id}
        });
    }
}

export class PlanningDocumentManagementTab extends Component{
    static template = "cpm_odoo.PlanningDocumentManagementTab"
    static components = {
        DocumentSetCard,
        DocumentCategoryCard
    }
    
    setup(){
        this.page_data = useState({
            display_document_category_list:[],
            document_set_list:[]
        })

        this.loadData()

        onWillStart(()=>{
            
        })

        onMounted(()=>{
            
        })

        useEffect(()=>{
            
        })
    }

    async loadData(){
        this.page_data.display_document_category_list = await this.props.context_data.orm.call(
            'cpm_odoo.documents_document_category',
            'search_read',
            [
                [
                    ['display','=',true]
                ],
                [],
                0,8,"name"
            ]
        )

        
        this.page_data.document_set_list = await this.props.context_data.orm.call(
            'cpm_odoo.documents_document_set',
            'search_read',
            [
                [
                    
                ],
                [],
                0,8,"updated_at desc,name asc"
            ]
        )
    }

    async act_add_document(){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Create Document Set',
            res_model: 'cpm_odoo.documents_document_set',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_field': 'value' },  // Optional: default values for fields
        });
    }

    async act_add_category(){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Create Document Category',
            res_model: 'cpm_odoo.documents_document_category',  // Model name
            view_mode: 'form',
            views: [[false, 'form']],
            target: 'new',
            context: { 'default_field': 'value' },  // Optional: default values for fields
        });
    }

    async act_show_more_document_categories(){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.document_category_item_list',
            context: {}
        });
    }

    async act_show_more_document_sets(context_data){
        await this.props.context_data.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.document_set_item_list',
            context: context_data
        });
    }
}

class DocumentSetDownloadLatestDocBtn extends Component{
    static template = "cpm_odoo.DocumentSetDownloadLatestDocBtn"
    
    
}


class DocumentSetDetailDocumentList extends ItemList{
    static template = "cpm_odoo.DocumentSetDetailDocumentList"
    static formatDateTime = formatDateTime
    setup(){
        super.init()

        this.page_data.model_name = "cpm_odoo.documents_document"
        this.page_data.column_list = ['file_name','uploaded_by','date_uploaded','file_size','id','document_set_id']//columns to get from model
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
        if(!confirm(`Download ${doc.file_name?doc.file_name:'document'}?`)){
            return
        }
        
        let result = await this.orm.call(
            'cpm_odoo.documents_document',
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
        if(!confirm(`Delete ${doc.file_name?doc.file_name:'document'}?`)){
            return
        }


        this.orm.call(
            "cpm_odoo.documents_document",
            "unlink",
            [
                doc.id
            ]
        )
        window.location.reload()
    }
}

class DocumentSetDetailPage extends Component{
    static template = "cpm_odoo.DocumentSetDetailPage"
    
    static components = {
        DocumentSetDetailDocumentList
    }
    static clientActionName = "cpm_odoo.document_set_detail"

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
            this.extra_domain = [['document_set_id','=',this.context.document_set_id]]
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
            "cpm_odoo.documents_document_set",
            "read",
            [
                this.context.document_set_id
            ]
        ))[0]
    }

    async act_add_doc_to_set(){
        let result = await this.orm.call(
            'cpm_odoo.documents_document_set',
            'act_add_doc_to_set',
            [
                this.context.document_set_id
            ]
        )
        this.action.doAction(
            result
        )
    }

    async act_edit_doc_set_info(){
        this.action.doAction({
            type: 'ir.actions.act_window',
            name: 'Document Set - Info',
            res_model: 'cpm_odoo.documents_document_set',  // Replace with the model name, e.g., 'res.partner'
            res_id: this.context.document_set_id,  // ID of the record you want to edit
            views: [[false, 'form']],  // Open the form view for editing
            target: 'new',  // Open in a new window, you can also use 'current' to open in the same window
            context:{
                action_name:"Edit Info"
            }
        })
    }
}

registry.category("actions").add(DocumentSetDetailPage.clientActionName, DocumentSetDetailPage);

class DocumentCategoryItemList extends ItemList{
    static template = "cpm_odoo.DocumentCategoryItemList"
    static components={
        SearchBar,
        DocumentCategoryCard
    }
    

    setup(){
        super.init()

        this.page_data.model_name = "cpm_odoo.documents_document_category"
        this.page_data.column_list = []//columns to get from model
        this.page_data.order_by_str = "name asc"

        this.action = useService("action")
        
        super.setup()
    }

    async act_show_more_document_sets(context_data){
        await this.action.doAction({
            type: 'ir.actions.client',
            tag: 'cpm_odoo.document_set_item_list',
            context: context_data
        });
    }
}

class DocumentCategoryListPage extends Component{
    static template = "cpm_odoo.DocumentCategoryListPage"
    static components = {
        DocumentCategoryItemList
    }
    
    static clientActionName = "cpm_odoo.document_category_item_list"

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
        }
        else{
            window.history.back()
        }
    }
}

registry.category("actions").add(DocumentCategoryListPage.clientActionName, DocumentCategoryListPage);

export class DocumentSetItemList extends ItemList{
    static template = "cpm_odoo.DocumentSetItemList"
    static components = {
        SearchBar,
        DocumentSetCard
    }
    

    setup(){
        super.init()

        this.page_data.model_name = "cpm_odoo.documents_document_set"
        this.page_data.column_list = []
        this.page_data.order_by_str = "category_id asc, updated_at desc, name asc"
        this.page_data.json_cols = ['category_id']

        this.search_filter.search_bar.cols=['name']
        
        useEffect(()=>{
            this.page_data.extra_domain = this.props.extra_domain
        },
        ()=>[this.props.extra_domain])

        super.setup()
    }
}

class DocumentSetListPage extends Component{
    static template = "cpm_odoo.DocumentSetListPage"
    static components = {
        DocumentSetItemList
    }
    
    static clientActionName = "cpm_odoo.document_set_item_list"

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
                this.extra_domain = [["category_id","=",this.context.category_id]]
            }
        }
        else{
            window.history.back()
        }
    }
}

registry.category("actions").add(DocumentSetListPage.clientActionName, DocumentSetListPage);