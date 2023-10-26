import { derived, writable } from "svelte/store";
import enLabels from "./en.json";
import frLabels from "./fr.json";

export const locale = writable("en");

function translate(locale, key, vars) {
    //console.log(locale);    
    let currentPositionInLabels=enLabels;
    if(locale!=="en") currentPositionInLabels=frLabels;
    let text=key;
    if(!key.includes('.')){
        text=currentPositionInLabels[key] || key;
    }else{
        const pathToFollowInLabels = key.split(".");
        for (let i = 0; i < pathToFollowInLabels.length; i++) {
            currentPositionInLabels = currentPositionInLabels[pathToFollowInLabels[i]]
            if (!currentPositionInLabels) {
                text=key;
            }
        }
        text= currentPositionInLabels
    }  
    
    // Replace any passed in variables in the translation string.
    Object.keys(vars).map((k) => {
        const regex = new RegExp(`{{${k}}}`, "g");
        text = text.replace(regex, vars[k]);
    });
    //console.log(text);
    return text;
}

export const t = derived(locale, ($locale) => (key, vars = {}) =>
  translate($locale, key, vars)
);