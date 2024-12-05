import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { error } from 'console';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OdooJsonRpcService {

  private odooUrl = 'http://dtmindustry.ddns.net:8069/jsonrpc'; // URL del endpoint JSON-RPC de Odoo

  constructor(private http: HttpClient) { }

  /**
   * Realiza una llamada JSON-RPC a Odoo
   * @param method Método a llamar (por ejemplo: "call")
   * @param params Parámetros a enviar a Odoo
   */
  private call(method: string, params: any): Observable<any> {
    const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    const body = {
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: new Date().getTime() // Usa un identificador único.

    };  
    // console.log("Pasa");
    return this.http.post(this.odooUrl, body, { headers});
  }

  authenticate():Observable<number>{
    let method ='call';
    let params = {
      service: 'common',
      method: 'authenticate',
      args: ['backup', 'rafaguzmang@hotmail.com', 'admin', {}], 
    };    

    return this.call(method, params).pipe(
      map((response: any) => response.result) // Transforma la respuesta y retorna solo `result`
    );
  }

  read(uid:number,domain:any,model:string,fields:any):Observable<any>{
    let method ='call';
    let params = {
            service: 'object',
            method: 'execute',
            args: [
              'backup',          // Base de datos
              uid,               // UID autenticado
              'admin',           // Contraseña
              model, // Nombre del modelo
              'search_read',     // Método a ejecutar
                domain, // Dominio para filtrar registros
                fields,
                0,    
                10,
            ],
          }

    return this.call(method, params).pipe(
      map((response: any) => response.result) // Transforma la respuesta y retorna solo `result`
    );
  }  

  update(uid:number,id:number,model:string,campos:any):Observable<any>{
    // console.log(uid,id,localizacion,cantidad,apartado,disponible)
    let method ='call';
    let params = {
          service: 'object',
          method: 'execute',
          args:  [
            "backup",     // Nombre de la base de datos
            uid,                          // ID del usuario que ejecuta la acción (Admin usualmente es 2)
            "admin",               // Contraseña del usuario
            model,        // Nombre del modelo (por ejemplo, 'res.partner')
            "write",                    // Método a ejecutar
            [id],
            campos] // Base de datos, usuario, contraseña, contexto
        }

    return this.call(method, params).pipe(
      map((response: any) => response.result) // Transforma la respuesta y retorna solo `result`
    );
  }

}
