export const fmt = (n)=> '₹'+ Number(n||0).toFixed(2);
export const fmtDate = (d)=> new Date(d).toLocaleString('en-IN');
