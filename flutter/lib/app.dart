import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/presentation/bloc/auth_bloc.dart';
import 'injection_container.dart';

class StayBookApp extends StatefulWidget {
  const StayBookApp({super.key});

  @override
  State<StayBookApp> createState() => _StayBookAppState();
}

class _StayBookAppState extends State<StayBookApp> {
  late final _router = buildAppRouter();

  @override
  Widget build(BuildContext context) {
    return BlocProvider<AuthBloc>.value(
      value: sl<AuthBloc>(),
      child: MaterialApp.router(
        title: 'StayBook',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        routerConfig: _router,
      ),
    );
  }
}
