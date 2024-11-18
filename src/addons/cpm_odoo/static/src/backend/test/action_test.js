/** @odoo-module **/
import { Component, onWillStart, onMounted, mount, loadFile} from "@odoo/owl"
import { registry } from "@web/core/registry"


class TestPage extends Component {
    static template = "cpm_odoo.TestPage";

    setup(){

    }
}

registry.category("actions").add("cpm_odoo.action_test", TestPage);