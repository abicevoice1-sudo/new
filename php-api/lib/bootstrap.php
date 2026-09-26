<?php
// Core bootstrap: .env loading, JSON/HTTP helpers, client IP.
// DB lives in db.php; JWT in jwt.php; mail in mail.php; rate limit in ratelimit.php.

if (file_exists(__DIR__.'/../.env')) {
    foreach (file(__DIR__.'/../.env', FILE_IGNORE_NEW_LINES|FILE_SKIP_EMPTY_LINES) as $l) {
        $l=trim($l);
        if($l===''||$l[0]==='#')continue;
        if(strpos($l,'=')!==false){[$k,$v]=explode('=',$l,2);putenv(trim($k).'='.trim($v));}
    }
}
date_default_timezone_set(getenv('TZ')?: 'UTC');
mb_internal_encoding('UTF-8');

function json(mixed $d,int $s=200):never{
    http_response_code($s);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('X-Content-Type-Options: nosniff');
    $e=json_encode($d,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    if($e===false){http_response_code(500);echo json_encode(['error'=>'Internal encoding error']);}
    else echo $e;
    exit;
}
function je(string $m,int $s=400):never{json(['error'=>$m],$s);}
function qp(string $k,mixed $d=null):mixed{return $_GET[$k]??$d;}
function hbearer():?string{
    $h=$_SERVER['HTTP_AUTHORIZATION']??'';
    if(str_starts_with($h,'Bearer '))return substr($h,7);
    $h=$_SERVER['REDIRECT_HTTP_AUTHORIZATION']??'';
    if(str_starts_with($h,'Bearer '))return substr($h,7);
    if(function_exists('getallheaders')){
        $a=getallheaders();
        foreach(['Authorization','authorization'] as $k){
            if(isset($a[$k])&&str_starts_with($a[$k],'Bearer '))return substr($a[$k],7);
        }
    }
    return null;
}
function cip():string{
    if((int)getenv('TRUST_PROXY')===1){
        foreach(['HTTP_X_FORWARDED_FOR','HTTP_X_REAL_IP','REMOTE_ADDR'] as $k){
            $v=$_SERVER[$k]??'';
            if($v!=='')return trim(explode(',',$v)[0]);
        }
    }
    return $_SERVER['REMOTE_ADDR']??'0.0.0.0';
}
function isLocalIp(string $ip):bool{
    return in_array($ip,['127.0.0.1','::1','::ffff:127.0.0.1'],true);
}
