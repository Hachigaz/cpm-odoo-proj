/** @odoo-module **/ 
import { Component, onWillStart, onMounted, useEffect, useRef} from "@odoo/owl";

export class GanttDisplay extends Component{
    static template = "cpm_odoo.cmp_schedule_display"
    // inputs:
    // context_params
    // state_data
    setup(){
        this.component_context = {
            display_size:{
                width:"100%",
                height:"60vh"
            }
        }
        this.gantt_graph_display = useRef("gantt_graph_display")

        this.graph_data = {
            data:[],
            links:[]
        }

        let display_size = this.props.context_params.display_size
        if(display_size!==undefined){
            if(display_size.width!==undefined){
                this.component_context.display_size.width = display_size.width   
            }
            if(display_size.height!==undefined){
                this.component_context.display_size.height = display_size.height
            }
        }
    
        onWillStart(()=>{
            
        })

        onMounted(()=>{
            this._setup_graph()
        })

        useEffect(()=>{
            this._update_graph_data()

            gantt.clearAll();
            gantt.parse({
                data: this.graph_data.data,
                links:this.graph_data.links
            });
        })
    }

    setup_graph(){
    }

    _setup_graph(){
        gantt.config.date_format = "%Y-%m-%d";
        gantt.init(this.gantt_graph_display.el);

        gantt.config.scales = [
            {
                format : "%m/%y",
                unit : "month",
                step: 1
            },
            {
                unit: "week", 
                step: 2, 
                date: "Week %W"
            }
        ]

        gantt.config.layout = {
            css: "gantt_container",
            rows:[
                {
                    cols: [
                    {
                        // the default grid view  
                        view: "grid",  
                        scrollX:"scrollHor", 
                        scrollY:"scrollVer"
                    },
                    { resizer: true, width: 1 },
                    {
                        // the default timeline view
                        view: "timeline", 
                        scrollX:"scrollHor", 
                        scrollY:"scrollVer"
                    },
                    {
                        view: "scrollbar", 
                        id:"scrollVer"
                    }
                ]},
                {
                    view: "scrollbar", 
                    id:"scrollHor"
                }
            ]
        }

        gantt.config.min_column_width = 100;

        gantt.config.drag_move = false;     
        gantt.config.drag_resize = false;   
        gantt.config.drag_progress = false;
        gantt.config.drag_links = false;

        this.setup_graph()
    }

    _update_graph_data(){
        this.update_graph_data()
    }

    update_graph_data(){
    }
}