/* Author: Luca Viggiani <lviggiani@gmail.com>
   Credits: https://github.com/lviggiani/dragonfly-threeviewer/
*/
export function rad2Deg(rad:number):number {
    return rad / Math.PI * 180;
}

export function deg2Rad(deg:number):number {
    return deg * Math.PI / 180;
}

export function round(num:number, decimalPlaces = 0):number {
    const p = Math.pow(10, decimalPlaces);
    return Math.round(num * p) / p;
}